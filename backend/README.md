# Vijayadashami Carnival — Backend API
 
Node.js, Express, and MongoDB backend for the Vijayadashami Carnival event registration system at SRMU Campus, B5.

## Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MONGODB_URI, PORT, ADMIN_USERNAME, and ADMIN_PASSWORD

# 3. Create or Reset Initial Admin Account (Optional CLI helper)
node src/scripts/bootstrapAdmin.js admin <your-secure-password> "Event Lead Organizer"

# 4. Start server
npm start

# 5. Run full automated test suite (53 integration tests)
npm test
```

## Structure

- `src/config/`: Database connection (`db.js`) & Games catalogue (`gamesCatalogue.js`)
- `src/controllers/`: Public registration (`registrationController.js`), Public certificates (`publicCertificateController.js`), Admin auth (`adminAuthController.js`), Admin dashboard (`adminDashboardController.js`), Admin certificates (`adminCertificateController.js`)
- `src/middleware/`: Safe error handler (`errorHandler.js`), 404 handler (`notFound.js`), Auth & CSRF (`authMiddleware.js`), Rate limiters (`rateLimiters.js`)
- `src/models/`: Registration (`Registration.js`), Certificate (`Certificate.js`), Admin User (`AdminUser.js`), Admin Session (`AdminSession.js`)
- `src/routes/`: Public routes (`healthRoutes.js`, `gameRoutes.js`, `registrationRoutes.js`, `certificateRoutes.js`), Admin routes (`adminRoutes.js`)
- `src/scripts/`: Admin bootstrap script (`bootstrapAdmin.js`)
- `src/services/`: Certificate PDF generation (`certificateService.js` with PDFKit & QRCode)
- `src/validators/`: Payload allowlist and input validation (`registrationValidator.js`)
- `tests/`: Integration tests for registrations (`registration.test.js`), admin dashboard (`admin.test.js`), and certificates (`certificate.test.js`)

## Public Certificate API Endpoints (Phase 7)

- `GET /api/certificates/verify/:token`: Authenticity verification; returns valid/revoked status, participant name, event details, and cert ID without exposing private student data (no mobile or roll numbers).
- `GET /api/certificates/download/:token`: Streams genuine downloadable PDF certificate with embedded QR code.
- `GET /api/certificates/student/:registrationId`: Checks participation verification and certificate status for students.

## Admin Certificate API Endpoints (Phase 7)

- `GET /api/admin/certificates/participants`: Lists participants with attendance verification and certificate issuance status.
- `POST /api/admin/certificates/verify-participation/:registrationId`: Marks participation attendance as verified.
- `POST /api/admin/certificates/revoke-verification/:registrationId`: Reverts verification status and revokes any issued certificate.
- `POST /api/admin/certificates/issue/:registrationId`: Generates and issues collision-resistant Certificate ID (`SRMU-CERT-2026-XXXXXX`) and cryptographic token (only for verified attendees).
- `POST /api/admin/certificates/:certificateId/revoke`: Revokes issued certificate with audit reason.
- `GET /api/admin/certificates/:certificateId/download`: Admin PDF certificate download endpoint.

## Admin Dashboard API Endpoints

- `POST /api/admin/login`: Rate-limited authentication; sets HttpOnly session cookie
- `POST /api/admin/logout`: Destroys session in MongoDB and clears cookies
- `GET /api/admin/me`: Verifies active session and returns admin profile
- `GET /api/admin/dashboard`: Aggregates live database statistics (includes attendance and certificate counts)
- `GET /api/admin/registrations`: Searchable, filterable, paginated registration table
- `GET /api/admin/registrations/:registrationId`: Full registration details with unmasked phone for verified organizers
- `PATCH /api/admin/registrations/:registrationId`: Updates registration status (`confirmed`, `cancelled`, `pending`) with CSRF verification
- `DELETE /api/admin/registrations/:registrationId`: Deletes duplicate/test registration with CSRF verification
- `GET /api/admin/games/:gameId/registrations`: Game-wise participant breakdown and roster
- `GET /api/admin/registrations/export`: Generates sanitized CSV report with formula injection protection (includes Participation Status and Certificate Issued columns)

