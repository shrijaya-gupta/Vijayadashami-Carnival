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
    upi_id: 'srmu.carnival@upi',
    upi_name: 'SRMU B5 Carnival Desk',
    qr_image_url: '',
    is_qr_active: false,
    announcement: 'Registrations are open! ₹5 entry fee per game.'
  },
  gameScores: [
    { id: '1', game_id: 'lemon-race', game_name: 'Lemon and Spoon Race', participant_name: 'Aarav Sharma', roll_number: '2023101011001', score: '14.2s (Fastest Lap)', rank: 1, category: 'Solo' },
    { id: '2', game_id: 'lemon-race', game_name: 'Lemon and Spoon Race', participant_name: 'Priya Verma', roll_number: '2023101011045', score: '15.8s', rank: 2, category: 'Solo' },
    { id: '3', game_id: 'target-shooting', game_name: 'Target Shooting Challenge', participant_name: 'Vikramaditya Singh', roll_number: '2022101012014', score: '95 Points', rank: 1, category: 'Solo' },
    { id: '4', game_id: 'musical-chairs', game_name: 'Musical Chairs', participant_name: 'Ananya Gupta', roll_number: '2024101013009', score: 'Winner (Round 4)', rank: 1, category: 'Solo' },
    { id: '5', game_id: 'cup-balloon-pyramid', game_name: 'Cup & Balloon Pyramid', participant_name: 'Rohan & Team', roll_number: '2023101011088', score: '1 min 12s', rank: 1, category: 'Team' },
    { id: '6', game_id: 'balloon-dual-race', game_name: 'Balloon Dual Race', participant_name: 'Kabir & Sanya', roll_number: '2024101014022', score: '18.4s', rank: 1, category: 'Pairs' }
  ]
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
      total_amount: regData.totalAmount != null ? regData.totalAmount : (regData.total_amount != null ? regData.total_amount : 5),
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

  async getAllRegistrations() {
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
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
    if (supabase) {
      let query = supabase.from('game_scores').select('*').order('rank', { ascending: true });
      if (gameId && gameId !== 'all') {
        query = query.eq('game_id', gameId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    }
    if (gameId && gameId !== 'all') {
      return memoryStore.gameScores.filter(s => s.game_id === gameId);
    }
    return memoryStore.gameScores;
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
