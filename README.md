# Vijayadashami Carnival — Full-Stack Registration Web Application

A college event registration web application for the **Vijayadashami Carnival** at Shri Ramswaroop Memorial University.

- **Event Name:** Vijayadashami Carnival
- **Date:** Thursday, 29 October 2026
- **Time:** 11:00 AM
- **Venue:** SRMU Campus, Building B5
- **Current Milestone:** **Phase 7: Verified Participation Certificates with QR Verification**

---

## 1. System Architecture

The project is structured with a decoupled, clean architecture:
- **Public Frontend:** Vanilla HTML5, CSS3, and JavaScript running in any modern browser. Supports responsive design, accessibility (WCAG AA), real-time validation, multi-game selection, and genuine registration confirmation.
- **Certificate Verification Portal (`verify.html` & `js/verify.js`):** Public QR scan destination that validates digital authenticity in real-time, displays participant name and certificate credentials, enables genuine PDF download, and strictly safeguards student privacy (no mobile numbers or roll numbers exposed).
- **Admin Dashboard (`admin/`):** Dedicated organizer portal with authentication, real-time database analytics, participant attendance verification, certificate generation & issuance (`SRMU-CERT-2026-XXXXXX`), revocation workflow, searchable/filterable tables, and sanitized CSV data export.
- **Backend API (`backend/`):** Node.js and Express.js REST API with Helmet security headers, CORS origin enforcement, request payload limiting (50KB), rate limiting, bcrypt password hashing, MongoDB TTL-backed server sessions, CSRF protection, PDF generation via `pdfkit`, and QR code generation via `qrcode`.
- **Database:** MongoDB (Local or MongoDB Atlas) managed via Mongoose ODM with schema-level validation and idempotency key handling to prevent duplicate registrations on network retries.

```
fun games/
├── admin/                              # Organizer Management Portal
│   ├── css/
│   │   └── admin.css                   # Admin dashboard design system
│   ├── js/
│   │   ├── login.js                    # Admin authentication controller
│   │   └── dashboard.js                # Dashboard overview, certificates, table, & modal logic
│   ├── dashboard.html                  # Secure organizer dashboard interface
│   └── login.html                      # Dedicated administrator login page
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                   # Mongoose connection with sanitized logging
│   │   │   └── gamesCatalogue.js       # Authoritative 6-game catalogue with provisional rules
│   │   ├── controllers/
│   │   │   ├── adminAuthController.js  # Admin login, logout, and session check
│   │   │   ├── adminCertificateController.js # Participation verification, cert issuance, revocation
│   │   │   ├── adminDashboardController.js # Analytics, registrations table, CSV export
│   │   │   ├── publicCertificateController.js# Public QR verification & PDF download
│   │   │   └── registrationController.js # Public registration creation & lookup
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # Session verification & CSRF protection
│   │   │   ├── errorHandler.js         # Safe error handler (no stack trace leaks)
│   │   │   ├── notFound.js             # 404 handler for undefined API routes
│   │   │   └── rateLimiters.js         # Public, login, export, and cert rate limiters
│   │   ├── models/
│   │   │   ├── AdminSession.js         # Server-managed session with MongoDB TTL index
│   │   │   ├── AdminUser.js            # Bcrypt-hashed administrator accounts
│   │   │   ├── Certificate.js          # Mongoose model for participation certificates & tokens
│   │   │   └── Registration.js         # Student registration schema & participation status
│   │   ├── routes/
│   │   │   ├── adminRoutes.js          # Protected /api/admin/* endpoints
│   │   │   ├── certificateRoutes.js    # Public /api/certificates/* endpoints
│   │   │   ├── gameRoutes.js           # GET /api/games
│   │   │   ├── healthRoutes.js         # GET /api/health
│   │   │   └── registrationRoutes.js   # Public registration endpoints
│   │   ├── scripts/
│   │   │   └── bootstrapAdmin.js       # Admin CLI bootstrap & password reset utility
│   │   ├── services/
│   │   │   └── certificateService.js   # PDFKit landscape A4 generator & QRCode generator
│   │   ├── validators/
│   │   │   └── registrationValidator.js# Strict server-side allowlists & mobile regex
│   │   ├── app.js                      # Express app (Helmet, CORS, cookies, limits, cert routes)
│   │   └── server.js                   # Server bootstrap & graceful shutdown
│   ├── tests/
│   │   ├── admin.test.js               # 21 admin integration tests
│   │   ├── certificate.test.js         # 17 certificate & QR verification tests
│   │   └── registration.test.js        # 15 public API integration tests
│   ├── .env.example                    # Template for environment configuration
│   ├── .gitignore                      # Git ignore for node_modules and .env
│   ├── package.json                    # Backend dependencies & test scripts
│   └── README.md                       # Backend technical documentation
├── assets/                             # Visual media and badges
├── css/
│   ├── mela-decorations.css            # Indian festival mela styling, 10-headed effigy & welcome intro animations
│   └── style.css                       # Design system and core stylesheets
├── js/
│   ├── games-data.js                   # Frontend game catalog metadata
│   ├── registration.js                 # Form handling, validation, preview & backend fetch
│   ├── script.js                       # Navigation, modals, filter chips & UI interactions
│   ├── verify.js                       # Public certificate QR verification script
│   └── welcome-intro.js                # Animated welcome intro controller, canvas sparks & audio/motion handling
├── index.html                          # Semantic HTML5 single-page application with festive welcome intro overlay
├── server.js                           # Lightweight local static dev server (port 3000)
├── verify.html                         # Public certificate verification page
├── .gitignore                          # Root ignore file
└── README.md                           # Project root documentation
```

---

## 2. Prerequisites & Runtime Requirements

- **Node.js:** v18.x or v20.x LTS or higher
- **npm:** v9.x or higher
- **MongoDB:**
  - **Local:** MongoDB Community Server (v6.0+) running on `127.0.0.1:27017`, **OR**
  - **Cloud:** MongoDB Atlas cluster with an M0 free tier or higher connection string.

---

## 3. Quick Start & Installation

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory:
```bash
cp .env.example .env
```
Edit `backend/.env` with your settings:
```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/srmu_fun_games
CLIENT_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5000
NODE_ENV=development
```

> **Security Note:** The `.env` file contains sensitive local configuration and is ignored by Git. Never commit `.env` to source control.

### Step 3: Start MongoDB
- **Windows (Service):**
  ```powershell
  net start MongoDB
  ```
  *(Or verify via Services app: MongoDB Server service is "Running")*
- **macOS (Homebrew):**
  ```bash
  brew services start mongodb/brew/mongodb-community
  ```
- **Linux (systemd):**
  ```bash
  sudo systemctl start mongod
  ```

### Step 4: Start the Backend Server
```bash
cd backend
npm start
```
The backend API starts at `http://localhost:5000`. It verifies the MongoDB connection before accepting HTTP traffic.

### Step 5: Start the Frontend Static Server
In a separate terminal at the project root:
```bash
node server.js
```
The frontend will be available at `http://localhost:3000`.

---

## 4. API Endpoints Reference

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Description:** Verifies server and database connection health without exposing credentials or internal paths.
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Vijayadashami Carnival Registration API",
  "database": "connected",
  "timestamp": "2026-10-21T13:56:23.959Z"
}
```
If disconnected, returns `503 Service Unavailable` with `status: "degraded"` and `database: "disconnected"`.

---

### 2. Games Catalogue
- **Endpoint:** `GET /api/games`
- **Description:** Returns the single authoritative 6-game event catalogue with provisional rules status.
- **Response (200 OK):**
```json
{
  "success": true,
  "total": 6,
  "games": [
    {
      "id": "lemon-race",
      "name": "Lemon Race",
      "category": "Speed & Agility",
      "description": "Classic balance dash holding a spoon with a lemon in mouth.",
      "participationOptions": ["Individual (Solo)"],
      "rulesApprovalStatus": "Pending Organizer Approval",
      "isProvisional": true
    },
    {
      "id": "target-shooting",
      "name": "Target Shooting",
      "category": "Focus & Precision",
      "description": "Campus target challenge testing focus, aim, and precision in a supervised setup.",
      "participationOptions": ["Individual (Solo)", "Team (Partner / Group)"],
      "rulesApprovalStatus": "Pending Organizer Approval",
      "isProvisional": true
    }
    // ... 4 additional games
  ]
}
```

---

### 3. Create Registration
- **Endpoint:** `POST /api/registrations`
- **Headers:**
  - `Content-Type: application/json`
  - `Idempotency-Key: <unique-string>` *(optional, recommended for client retry safety)*
- **Sample Request Body:**
```json
{
  "student": {
    "fullName": "Aryan Verma",
    "mobileNumber": "9876501234",
    "rollNumber": "2024SRMU042",
    "course": "B.Tech",
    "branch": "Computer Science & Engineering",
    "academicYear": "2nd Year"
  },
  "selectedGames": [
    {
      "gameId": "lemon-race",
      "participationType": "individual"
    },
    {
      "gameId": "treasure-hunt",
      "participationType": "team",
      "teamName": "SRMU Mavericks",
      "teamMembers": [
        {
          "name": "Deepak Rao",
          "roll": "2024SRMU043",
          "contact": "9876501235"
        }
      ]
    }
  ]
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration submitted successfully.",
  "data": {
    "registrationId": "SRMU-2026-QR2L5K",
    "eventName": "Vijayadashami Carnival",
    "date": "Thursday, 29 October 2026",
    "time": "11:00 AM",
    "venue": "SRMU Campus, B5",
    "status": "confirmed",
    "student": {
      "fullName": "Aryan Verma",
      "rollNumber": "2024SRMU042",
      "course": "B.Tech",
      "branch": "Computer Science & Engineering",
      "academicYear": "2nd Year"
    },
    "selectedGames": [
      {
        "gameId": "lemon-race",
        "gameName": "Lemon Race",
        "participationType": "individual"
      },
      {
        "gameId": "target-shooting",
        "gameName": "Target Shooting",
        "participationType": "team",
        "teamName": "SRMU Mavericks",
        "teamMembersCount": 2
      }
    ],
    "createdAt": "2026-10-21T13:56:23.998Z"
  }
}
```

---

### 4. Minimal Registration Lookup
- **Endpoint:** `GET /api/registrations/:registrationId`
- **Description:** Returns safe confirmation details for a student registration without exposing sensitive contact numbers.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "registrationId": "SRMU-2026-QR2L5K",
    "eventName": "Vijayadashami Carnival",
    "date": "Thursday, 29 October 2026",
    "time": "11:00 AM",
    "venue": "SRMU Campus, B5",
    "status": "confirmed",
    "student": {
      "fullName": "Aryan Verma",
      "rollNumber": "2024SRMU042",
      "course": "B.Tech",
      "branch": "Computer Science & Engineering",
      "academicYear": "2nd Year"
    },
    "selectedGames": [
      {
        "gameId": "lemon-race",
        "gameName": "Lemon Race",
        "participationType": "individual"
      }
    ],
    "createdAt": "2026-10-21T13:56:23.998Z"
  }
}
```

---

## 5. Security & Data Protection Features

1. **Helmet HTTP Headers:** Protects against MIME sniffing, clickjacking, and XSS attacks.
2. **CORS Whitelist:** Only permits cross-origin requests from configured origins defined in `CLIENT_ORIGIN`.
3. **Strict Validation Allowlist:** Discards unexpected payload fields before parsing; prevents mass-assignment vulnerabilities.
4. **Rate Limiting:** Public write endpoints are limited to 30 requests per 15 minutes per IP.
5. **No Stack Trace Leaks:** Error responses use structured JSON error messages without exposing database internals, stack traces, or environment paths.
6. **Student Privacy Protection:** Public lookups and preview responses omit personal mobile phone numbers.
9. **Server-Side Admin Authentication:** Passwords hashed with bcrypt; server-managed sessions stored in MongoDB with automatic TTL expiration.
10. **CSRF Protection:** State-changing admin requests (`POST`, `PATCH`, `DELETE`) require a cryptographically verified `X-CSRF-Token` header.
11. **CSV Formula Injection Mitigation:** All exported CSV cells are sanitized against spreadsheet formula execution (CWE-1236).

---

## 6. Running Automated Tests

The backend includes 36 automated integration tests using the native Node.js test runner (`node:test`) and `supertest`:

```bash
cd backend
npm test
```

### Test Coverage Highlights (36 Tests):

#### Public Registration API (`tests/registration.test.js` — 15 Tests):
1. `GET /api/health` returns 200 and healthy database status.
2. `GET /api/games` returns authoritative catalogue of 6 games with provisional status tags.
3. Missing required student fields rejection (HTTP 400).
4. Invalid Indian mobile number format rejection (HTTP 400).
5. Empty `selectedGames` rejection (HTTP 400).
6. Non-catalogue game ID rejection (HTTP 400).
7. Invalid participation type rejection (HTTP 400).
8. Missing team name when format is team rejection (HTTP 400).
9. Successful individual registration creation with unique server ID (HTTP 201).
10. Successful team registration with member roster persistence (HTTP 201).
11. Idempotent retry deduplication with identical key (HTTP 200 without duplicates).
12. Safe minimal registration lookup without leaking phone numbers (HTTP 200).
13. Non-existent registration ID returns 404.
14. Malformed JSON returns 400 without leaking stack traces.
15. Database connection failure returns 503 on health endpoint and safely handles write errors.

#### Admin Dashboard & Security (`tests/admin.test.js` — 21 Tests):
16. Unauthenticated users cannot access admin dashboard APIs (HTTP 401).
17. Invalid login attempts with wrong password return generic HTTP 401.
18. Invalid login attempts with non-existent username return generic HTTP 401 (prevents user enumeration).
19. Valid administrator authentication succeeds, sets HttpOnly session cookie, and returns CSRF token.
20. `GET /api/admin/me` returns authenticated admin identity with valid session cookie.
21. Dashboard statistics match actual database records accurately.
22. Student registered for multiple games counts as 1 unique registration and appears in both games.
23. Search by name, roll number, or registrationId returns matching records.
24. Filtering by game, format, and status returns correct records.
25. Registration table list view masks mobile phone numbers for student privacy.
26. Pagination correctly calculates page, limit, and totalPages.
27. Authenticated organizer can view unmasked registration details.
28. Unauthenticated requests to registration details are rejected (HTTP 401).
29. `PATCH` registration without `X-CSRF-Token` header is rejected (HTTP 403 Forbidden).
30. `PATCH` registration with valid CSRF token updates status in database.
31. Invalid status payload is rejected (HTTP 400 Bad Request).
32. Game-wise participant endpoint returns roster and estimated players.
33. CSV export requires authentication and sanitizes formula injection characters.
34. Session expiration is handled properly.
35. Logout invalidates the server-side session and subsequent calls return HTTP 401.
36. Public student registration creation continues to function with HTTP 201 Created.

---

## 7. Admin Dashboard Access & Usage

### Web Portal:
- **Login URL:** `http://localhost:3000/admin/login.html` (or `http://localhost:5000/admin/login.html`)
- **Dashboard URL:** `http://localhost:3000/admin/dashboard.html`

### CLI Administrator Setup:
Create or reset an organizer account via terminal:
```bash
cd backend
node src/scripts/bootstrapAdmin.js admin <your-secure-password> "Event Lead Organizer"
```

---

## 8. Troubleshooting

- **Database Connection Error (`ECONNREFUSED 127.0.0.1:27017`):**
  Ensure MongoDB service is running locally (`net start MongoDB` on Windows) or check your Atlas connection string in `backend/.env`.
- **CORS Error in Browser Console:**
  Ensure the URL you use to open the frontend (e.g. `http://localhost:3000`) is included in the comma-separated `CLIENT_ORIGIN` list in `backend/.env`.
- **CSRF Token Mismatch (HTTP 403):**
  Verify that the browser accepts cookies and sends the `X-CSRF-Token` header on state-changing requests.
- **Port In Use (`EADDRINUSE 5000`):**
  Change `PORT` in `backend/.env` to another open port (e.g., `5001`).

---

## 9. Public Cloud Deployment Guide

To deploy this project publicly for student participation:

### Option A: Unified Node.js Deployment (e.g., Render, Railway, DigitalOcean App Platform)
1. **Create a MongoDB Database:**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
   - Whitelist network access (`0.0.0.0/0`) and create a database user.
   - Copy the connection URI: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/srmu_fun_games?retryWrites=true&w=majority`.
2. **Deploy the Backend Web Service:**
   - Connect your GitHub repository to Render or Railway.
   - Set **Root Directory** to `backend`.
   - Set **Build Command** to `npm install`.
   - Set **Start Command** to `npm start`.
   - Configure **Environment Variables**:
     - `NODE_ENV=production`
     - `PORT=5000` (or leave default assigned by host)
     - `MONGODB_URI=<your-atlas-connection-string>`
     - `CLIENT_ORIGIN=https://<your-frontend-domain>`
     - `SESSION_SECRET=<random-strong-secret>`
     - `ADMIN_USERNAME=admin`
     - `ADMIN_PASSWORD=<strong-admin-password>`
3. **Deploy the Frontend (Static Site or Node.js):**
   - Connect the repository to **Vercel**, **Netlify**, or **Render Static Site**.
   - If deploying static frontend, set the API base URL in `js/registration.js` and `admin/js/dashboard.js` or configure reverse proxy rewrites (`/api/* -> backend API`).
   - Add your frontend domain to `CLIENT_ORIGIN` in the backend environment variables.

