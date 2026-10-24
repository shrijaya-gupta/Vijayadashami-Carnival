const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const app = require('./app');
const db = require('./config/supabase');

const PORT = parseInt(process.env.PORT, 10) || 5000;

let server;

async function startServer() {
  try {
    // 1. Initialize Supabase / Database layer
    console.log('================================================================');
    console.log('VIJAYADASHAMI CARNIVAL BACKEND (SRMU B5-408) — POWERED BY SUPABASE');
    console.log('================================================================');
    
    if (db.isSupabaseConfigured) {
      console.log(`[DATABASE] Connected to Supabase Cloud Database: ${process.env.SUPABASE_URL}`);
    } else {
      console.log('[DATABASE] Supabase credentials pending in .env.');
      console.log('[DATABASE] In-memory persistence active. Set SUPABASE_URL and SUPABASE_ANON_KEY to link live database.');
    }

    // 2. Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`\nServer listening on: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Payment QR Config: http://localhost:${PORT}/api/config/payment-qr`);
      console.log(`Live Scoreboard: http://localhost:${PORT}/api/config/scoreboard`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // 3. Graceful shutdown listeners
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      if (server) {
        server.close(() => {
          console.log('HTTP server closed cleanly.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
