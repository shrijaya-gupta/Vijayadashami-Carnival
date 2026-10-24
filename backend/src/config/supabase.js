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
    upi_name: 'Shrijaya Gupta (SRMU B5-408 Carnival Desk)',
    qr_image_url: '/assets/official-upi-qr.jpg',
    is_qr_active: true,
    announcement: 'Registrations are open! ₹10 flat fee for all carnival activities.'
  },
  gameScores: []
};

// -----------------------------------------------------------------------------
// Unified Database Repository Methods
// -----------------------------------------------------------------------------

module.exports = {
  supabase,
  isSupabaseConfigured,
  memoryStore,

  // Registrations
  async createRegistration(regData) {
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
      return allData;
    }
    return memoryStore.registrations;
  },

  // Event Config (Payment QR, UPI ID)
  async getEventConfig() {
    if (supabase) {
      const { data, error } = await supabase
        .from('event_config')
        .select('*')
        .eq('id', 'payment_config')
        .maybeSingle();
      if (!error && data) return data;
    }
    return memoryStore.eventConfig;
  },

  async updateEventConfig(configData) {
    const payload = {
      ...configData,
      id: 'payment_config',
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('event_config')
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    Object.assign(memoryStore.eventConfig, payload);
    return memoryStore.eventConfig;
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
