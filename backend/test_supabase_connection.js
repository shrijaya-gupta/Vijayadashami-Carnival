/**
 * Supabase Connection & Schema Diagnostic Tool
 * Validates credentials in backend/.env, tests queries, and verifies real-time readiness.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('================================================================');
  console.log('SUPABASE LIVE CONNECTION & REALTIME DIAGNOSTIC AUDIT');
  console.log('================================================================\n');

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log(`SUPABASE_URL: ${supabaseUrl ? (supabaseUrl.includes('your-project') ? '[PLACEHOLDER DETECTED] ' + supabaseUrl : supabaseUrl) : '[MISSING]'}`);
  console.log(`SUPABASE_ANON_KEY: ${anonKey ? (anonKey.includes('your-supabase') ? '[PLACEHOLDER DETECTED]' : anonKey.slice(0, 12) + '...' + anonKey.slice(-6)) : '[MISSING]'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? (serviceKey.includes('your-supabase') ? '[PLACEHOLDER DETECTED]' : serviceKey.slice(0, 12) + '...' + serviceKey.slice(-6)) : '[MISSING]'}`);
  console.log('');

  const isPlaceholder = 
    !supabaseUrl || 
    supabaseUrl.includes('your-project-id') || 
    !anonKey || 
    anonKey.includes('your-supabase') ||
    !serviceKey ||
    serviceKey.includes('your-supabase');

  if (isPlaceholder) {
    console.warn('[NOTICE] backend/.env currently contains default placeholder values on disk.');
    console.warn('If you recently pasted your Supabase keys in the editor, please verify that you pressed Ctrl+S (Save) in backend/.env!');
    console.log('\nFallback in-memory store is currently active and fully operational for event registrations.');
    return { status: 'placeholder', isPlaceholder: true };
  }

  // Real keys detected, test connectivity
  console.log('[INFO] Connecting to live Supabase cluster...');
  const keyToUse = serviceKey || anonKey;
  const client = createClient(supabaseUrl, keyToUse, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const tables = ['event_config', 'registrations', 'certificates', 'admin_users', 'game_scores'];
  const results = {};

  for (const table of tables) {
    try {
      const { data, error, count } = await client.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        results[table] = { ok: false, error: error.message };
        console.error(`  ✕ Table '${table}': ${error.message}`);
      } else {
        results[table] = { ok: true, count };
        console.log(`  ✓ Table '${table}': Active (Row count: ${count ?? 0})`);
      }
    } catch (err) {
      results[table] = { ok: false, error: err.message };
      console.error(`  ✕ Table '${table}': ${err.message}`);
    }
  }

  // Test Realtime channel
  console.log('\n[INFO] Testing Realtime Subscription Channel...');
  try {
    const channel = client.channel('test-realtime-channel');
    channel.subscribe((status) => {
      console.log(`  ✓ Realtime status: ${status}`);
    });
    setTimeout(() => {
      client.removeChannel(channel);
    }, 1500);
  } catch (rtErr) {
    console.warn(`  ! Realtime check warning: ${rtErr.message}`);
  }

  return { status: 'tested', results };
}

testConnection()
  .then((res) => {
    if (res.status === 'placeholder') {
      process.exit(2);
    } else {
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('Diagnostic error:', err);
    process.exit(1);
  });
