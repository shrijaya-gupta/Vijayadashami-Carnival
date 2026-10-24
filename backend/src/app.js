const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const healthRoutes = require('./routes/healthRoutes');
const gameRoutes = require('./routes/gameRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const configRoutes = require('./routes/configRoutes');
const notFoundHandler = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Security HTTP Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Permit local inline assets in static frontend
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS configuration restricted to allowed origins
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5000')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''));

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or vercel.app preview domain
    const isVercelDomain = typeof origin === 'string' && (origin.endsWith('.vercel.app') || origin === 'https://vercel.app');
    const isAllowed = allowedOrigins.includes(origin) || isVercelDomain || process.env.NODE_ENV !== 'production';
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin '${origin}' is not permitted by server policy.`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'Accept', 'X-CSRF-Token'],
  credentials: true
}));

// 3. Body parsers with strict size limit (protects against oversized payload attacks)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// 4. Cookie parser for HttpOnly session authentication
app.use(cookieParser());

// 5. API Endpoints
app.use('/api/health', healthRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/config', configRoutes);

// Direct QR Scan Redirect: /verify-certificate/:token -> /?token=...
app.get('/verify-certificate/:token', (req, res) => {
  const token = req.params.token;
  res.redirect(`/?token=${encodeURIComponent(token)}`);
});

// 6. Serve static frontend files (checks dist, monorepo root, backend/public, or local directory)
const candidateStaticPaths = [
  path.resolve(__dirname, '../../dist'),       // Production Vite build output
  path.resolve(__dirname, '../../'),          // Monorepo / local dev root
  path.resolve(__dirname, '../public'),       // backend/public directory
  path.resolve(process.cwd(), 'dist'),        // CWD dist
  path.resolve(process.cwd(), 'public'),      // CWD/public
  path.resolve(process.cwd(), '../'),         // CWD parent
  process.cwd()                               // CWD
];

const frontendPath = candidateStaticPaths.find(p => {
  try {
    return fs.existsSync(path.join(p, 'index.html'));
  } catch {
    return false;
  }
});

if (frontendPath) {
  app.use(express.static(frontendPath));

  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  app.get('/verify', (req, res) => {
    res.sendFile(path.join(frontendPath, 'verify.html'));
  });
} else {
  // If frontend is deployed separately, provide a clean JSON API root status document
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      service: 'Vijayadashami Carnival REST API',
      status: 'online',
      environment: process.env.NODE_ENV || 'production',
      message: 'Vijayadashami Carnival backend API is running. The frontend is hosted at the repository root or a linked web domain.',
      endpoints: {
        health: '/api/health',
        games: '/api/games',
        config: '/api/config',
        registrations: '/api/registrations',
        admin: '/api/admin'
      }
    });
  });
}

// 7. 404 & Central Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
