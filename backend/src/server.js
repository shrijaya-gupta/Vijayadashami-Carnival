require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const AdminUser = require('./models/AdminUser');

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Validate required environment configurations before starting
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is required. Please check your .env configuration.');
  process.exit(1);
}

let server;

async function startServer() {
  try {
    // 1. Establish database connection first
    console.log('Connecting to MongoDB...');
    await connectDB();

    // 2. Ensure initial administrator exists if configured in environment
    await AdminUser.ensureInitialAdmin();

    // 2. Start HTTP server only after database connection succeeds
    server = app.listen(PORT, () => {
      console.log(`Vijayadashami Carnival backend running on http://localhost:${PORT}`);
      console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // 3. Graceful shutdown listeners
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      if (server) {
        server.close(async () => {
          console.log('HTTP server closed.');
          await disconnectDB();
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('Failed to start server due to database connection failure:', error.message);
    process.exit(1);
  }
}

startServer();
