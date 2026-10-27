const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project'));

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log(`[SUPABASE] Connected to Supabase Project: ${supabaseUrl}`);
  } catch (err) {
    console.warn(`[SUPABASE] Warning: Failed to initialize Supabase client:`, err.message);
  }
} else {
  console.log('[SUPABASE] Notice: SUPABASE_URL & keys not set in .env. Running with local in-memory persistence layer.');
}

// -----------------------------------------------------------------------------
// In-Memory Fallback Store (Used when Supabase credentials are pending in .env)
// -----------------------------------------------------------------------------
const memoryStore = {
  registrations: [],
  adminUsers: [
    {
      id: 'admin-001',
      username: 'admin',
      password_hash: bcrypt.hashSync('SrmuAdmin2026!Secure', 10),
      full_name: 'SRMU Event Lead Organizer',
      role: 'admin',
      last_login: null
    }
  ],
  adminSessions: [],
  certificates: [],
  eventConfig: {
    id: 'payment_config',
    upi_id: 'guptashrijaya-1@oksbi',
    upi_name: 'Shrijaya Gupta',
    payment_mobile: '8858500856',
    qr_image_url: '/assets/official-upi-qr.jpg',
    is_qr_active: true,
    announcement: 'Registrations are open! ₹10 flat fee for all carnival activities.'
  },
  gameScores: []
};

// Lightweight cache to deduplicate simultaneous dashboard and metric queries
let registrationsCache = null;
let registrationsCacheTime = 0;
const CACHE_TTL_MS = 2500; // 2.5 seconds cache

function invalidateRegistrationsCache() {
  registrationsCache = null;
  registrationsCacheTime = 0;
}

// -----------------------------------------------------------------------------
// Unified Database Repository Methods
// -----------------------------------------------------------------------------

module.exports = {
  supabase,
  isSupabaseConfigured,
  memoryStore,

  // Registrations
  async createRegistration(regData) {
    invalidateRegistrationsCache();
    const payload = {
      registration_id: regData.registrationId || regData.registration_id,
      student: regData.student,
      selected_games: regData.selectedGames || regData.selected_games || [],
      total_amount: regData.totalAmount != null ? regData.totalAmount : (regData.total_amount != null ? regData.total_amount : 10),
      payment_status: regData.paymentStatus || regData.payment_status || 'payment_pending',
      payment_reference: regData.paymentReference || regData.payment_reference || '',
      status: regData.status || 'confirmed',
      attendance_status: regData.attendanceStatus || regData.attendance_status || 'pending',
      idempotency_key: regData.idempotencyKey || regData.idempotency_key || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      // Keep memoryStore updated as hot backup
      memoryStore.registrations.unshift(data || payload);
      return data;
    }
    const record = { ...payload, id: `reg-${Date.now()}` };
    memoryStore.registrations.unshift(record);
    return record;
  },

  async findRegistrationById(regId) {
    const cleanId = String(regId).trim().toUpperCase();
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    return memoryStore.registrations.find(r => r.registration_id === cleanId) || null;
  },

  async getRegistrationById(regId) {
    return this.findRegistrationById(regId);
  },

  async updateRegistrationStatus(regId, updateFields) {
    invalidateRegistrationsCache();
    const cleanId = String(regId).trim().toUpperCase();
    const payload = {};
    if (updateFields.paymentStatus !== undefined || updateFields.payment_status !== undefined) {
      payload.payment_status = updateFields.paymentStatus || updateFields.payment_status;
    }
    if (updateFields.paymentReference !== undefined || updateFields.payment_reference !== undefined) {
      payload.payment_reference = updateFields.paymentReference || updateFields.payment_reference;
    }
    if (updateFields.status !== undefined) {
      payload.status = updateFields.status;
    }
    if (updateFields.attendanceStatus !== undefined || updateFields.attendance_status !== undefined) {
      payload.attendance_status = updateFields.attendanceStatus || updateFields.attendance_status;
    }
    payload.updated_at = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .update(payload)
        .eq('registration_id', cleanId)
        .select()
        .single();
      if (error) throw error;
      const memItem = memoryStore.registrations.find(r => r.registration_id === cleanId);
      if (memItem) Object.assign(memItem, payload);
      return data;
    }

    const item = memoryStore.registrations.find(r => r.registration_id === cleanId);
    if (item) {
      Object.assign(item, payload);
      return item;
    }
    return null;
  },

  async updateRegistrationPayment(regId, utr) {
    return this.updateRegistrationStatus(regId, {
      payment_reference: utr.trim().slice(0, 100),
      payment_status: 'payment_verification_pending'
    });
  },

  async deleteRegistration(regId) {
    invalidateRegistrationsCache();
    const cleanId = String(regId).trim().toUpperCase();
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .delete()
        .eq('registration_id', cleanId);
      if (error) {
        console.error('[SUPABASE DELETE ERROR]', error);
        throw error;
      }
      try {
        await supabase.from('certificates').delete().eq('registration_id', cleanId);
      } catch (e) {}
      const memIdx = memoryStore.registrations.findIndex(r => r.registration_id === cleanId);
      if (memIdx !== -1) memoryStore.registrations.splice(memIdx, 1);
      return data;
    }
    const idx = memoryStore.registrations.findIndex(r => r.registration_id === cleanId);
    if (idx !== -1) {
      const removed = memoryStore.registrations.splice(idx, 1)[0];
      const certIdx = memoryStore.certificates.findIndex(c => c.registration_id === cleanId);
      if (certIdx !== -1) memoryStore.certificates.splice(certIdx, 1);
      return removed;
    }
    return null;
  },

  async getAllRegistrations() {
    const now = Date.now();
    if (registrationsCache && (now - registrationsCacheTime) < CACHE_TTL_MS) {
      return [...registrationsCache];
    }

    if (supabase) {
      let allData = [];
      let from = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + step - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < step) break;
        from += step;
      }
      registrationsCache = allData;
      registrationsCacheTime = now;
      return allData;
    }
    registrationsCache = memoryStore.registrations;
    registrationsCacheTime = now;
    return memoryStore.registrations;
  },

  // Event Config (Payment QR, UPI ID, Fee, UTR policy, Registration status)
  async getEventConfig() {
    let raw = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('event_config')
        .select('*')
        .eq('id', 'payment_config')
        .maybeSingle();
      if (!error && data) raw = data;
    }
    if (!raw) raw = memoryStore.eventConfig;

    let extra = {};
    if (raw && raw.announcement) {
      try {
        extra = JSON.parse(raw.announcement);
      } catch (e) {
        extra = { announcement: raw.announcement };
      }
    }

    return {
      id: 'payment_config',
      upi_id: raw?.upi_id || 'guptashrijaya-1@oksbi',
      upi_name: raw?.upi_name || 'Shrijaya Gupta',
      payment_mobile: extra.payment_mobile || '8858500856',
      qr_image_url: raw?.qr_image_url || '/assets/official-upi-qr.jpg',
      is_qr_active: raw?.is_qr_active !== false,
      require_utr: extra.require_utr !== false, // default true: strictly requires UTR
      pass_fee: typeof extra.pass_fee === 'number' ? extra.pass_fee : (parseInt(extra.pass_fee, 10) || 10),
      registration_open: extra.registration_open !== false, // default true
      payment_mode: extra.payment_mode || 'online_upi', // 'online_upi' or 'both'
      whatsapp_group_url: extra.whatsapp_group_url || 'https://chat.whatsapp.com/Ev1kiwPGzrDFvopit0B12l',
      announcement: extra.announcement || 'Official registrations active. ₹10 flat fee for all carnival activities.',
      updated_at: raw?.updated_at || new Date().toISOString()
    };
  },

  async updateEventConfig(configData) {
    const current = await this.getEventConfig();
    const extra = {
      payment_mobile: configData.payment_mobile ? String(configData.payment_mobile).trim() : (current.payment_mobile || '8858500856'),
      require_utr: configData.require_utr !== undefined ? Boolean(configData.require_utr) : current.require_utr,
      pass_fee: configData.pass_fee !== undefined ? Math.max(0, parseInt(configData.pass_fee, 10) || 10) : current.pass_fee,
      registration_open: configData.registration_open !== undefined ? Boolean(configData.registration_open) : current.registration_open,
      payment_mode: configData.payment_mode ? String(configData.payment_mode).trim() : current.payment_mode,
      whatsapp_group_url: configData.whatsapp_group_url ? String(configData.whatsapp_group_url).trim() : current.whatsapp_group_url,
      announcement: configData.announcement !== undefined ? String(configData.announcement).trim() : current.announcement
    };

    const upi_id = configData.upi_id ? String(configData.upi_id).trim() : current.upi_id;
    const upi_name = configData.upi_name ? String(configData.upi_name).trim() : current.upi_name;
    const qr_image_url = configData.qr_image_url !== undefined ? String(configData.qr_image_url).trim() : current.qr_image_url;
    const is_qr_active = configData.is_qr_active !== undefined ? Boolean(configData.is_qr_active) : current.is_qr_active;

    const dbPayload = {
      id: 'payment_config',
      upi_id,
      upi_name,
      qr_image_url,
      is_qr_active,
      announcement: JSON.stringify(extra),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('event_config')
        .upsert(dbPayload)
        .select()
        .single();
      if (error) {
        console.error('[SUPABASE CONFIG UPDATE ERROR]', error);
        throw error;
      }
    }

    memoryStore.eventConfig = {
      ...dbPayload,
      ...extra
    };

    return {
      id: 'payment_config',
      upi_id,
      upi_name,
      qr_image_url,
      is_qr_active,
      ...extra,
      updated_at: dbPayload.updated_at
    };
  },

  async findRegistrationByUtr(utr) {
    if (!utr || typeof utr !== 'string') return null;
    const cleanUtr = utr.trim();
    if (!cleanUtr || cleanUtr === 'CASH_AT_DESK') return null;

    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('payment_reference', cleanUtr)
        .maybeSingle();
      if (!error && data) return data;
    }

    return memoryStore.registrations.find(r => 
      (r.payment_reference && r.payment_reference.trim() === cleanUtr) ||
      (r.paymentReference && r.paymentReference.trim() === cleanUtr)
    ) || null;
  },

  // Game Scores / Leaderboard
  async getGameScores(gameId) {
    let scores = [];
    if (supabase) {
      let query = supabase.from('game_scores').select('*').order('rank', { ascending: true });
      if (gameId && gameId !== 'all') {
        query = query.eq('game_id', gameId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) scores = data;
    } else {
      if (gameId && gameId !== 'all') {
        scores = memoryStore.gameScores.filter(s => s.game_id === gameId);
      } else {
        scores = [...memoryStore.gameScores];
      }
    }

    // Sort by rank ascending
    scores.sort((a, b) => (Number(a.rank) || 999) - (Number(b.rank) || 999));

    // Aggregate registered participant counts per game
    const regs = await this.getAllRegistrations().catch(() => memoryStore.registrations);
    const gameCounts = {};
    (regs || []).forEach(r => {
      const selected = Array.isArray(r.selected_games) ? r.selected_games : (Array.isArray(r.selectedGames) ? r.selectedGames : []);
      selected.forEach(g => {
        const id = typeof g === 'string' ? g : g.gameId;
        if (id) gameCounts[id] = (gameCounts[id] || 0) + 1;
      });
    });

    return {
      scores,
      participantCounts: gameCounts,
      totalRegisteredStudents: (regs || []).length
    };
  },

  async addGameScore(scoreData) {
    const crypto = require('crypto');
    const newId = crypto.randomUUID();
    const payload = {
      id: newId,
      game_id: scoreData.game_id || scoreData.gameId,
      game_name: scoreData.game_name || scoreData.gameName,
      participant_name: scoreData.participant_name || scoreData.participantName,
      roll_number: scoreData.roll_number || scoreData.rollNumber || '',
      score: String(scoreData.score || '').trim(),
      rank: parseInt(scoreData.rank, 10) || 1,
      category: scoreData.category || 'Solo',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('game_scores')
        .insert([payload])
        .select()
        .single();
      if (!error && data) return data;
      if (error) console.warn('Supabase add score warning:', error.message);
    }

    memoryStore.gameScores.push(payload);
    memoryStore.gameScores.sort((a, b) => a.rank - b.rank);
    return payload;
  },

  async deleteGameScore(id) {
    const cleanId = String(id).trim();
    if (supabase) {
      const { data, error } = await supabase.from('game_scores').delete().eq('id', cleanId).select();
      if (!error && data && data.length > 0) return data[0];
      if (!error) return { id: cleanId, deleted: true };
      if (error) console.warn('Supabase delete score warning:', error.message);
    }
    const idx = memoryStore.gameScores.findIndex(s => s.id === cleanId);
    if (idx !== -1) {
      return memoryStore.gameScores.splice(idx, 1)[0];
    }
    return null;
  },

  // Certificates
  async findCertificate(tokenOrId) {
    const clean = String(tokenOrId).trim().toUpperCase();
    if (supabase) {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .or(`certificate_id.eq.${clean},verification_token.eq.${tokenOrId}`)
        .maybeSingle();
      if (!error && data) return data;
    }
    return memoryStore.certificates.find(c => c.certificate_id === clean || c.verification_token === tokenOrId) || null;
  }
};
