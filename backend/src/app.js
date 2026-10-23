const express = require('express');
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

// Direct QR Scan Redirect: /verify-certificate/:token -> /verify.html?token=...
app.get('/verify-certificate/:token', (req, res) => {
  const token = req.params.token;
  res.redirect(`/verify.html?token=${encodeURIComponent(token)}`);
});

// 6. Serve static frontend files from workspace root (e.g. index.html, admin/...)
const frontendPath = path.resolve(__dirname, '../../');
app.use(express.static(frontendPath));

// Explicit route fallbacks for root and verify if routed through Express
app.get('/', (req, res, next) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

app.get('/verify', (req, res, next) => {
  const verifyPath = path.join(frontendPath, 'verify.html');
  res.sendFile(verifyPath, (err) => {
    if (err) next();
  });
});

// 7. 404 & Central Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
