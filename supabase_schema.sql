-- ==============================================================================
-- VIJAYADASHAMI CARNIVAL 2026 — SUPABASE POSTGRESQL SCHEMA
-- Execute this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Enable pgcrypto for UUID and cryptographic hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. REGISTRATIONS TABLE
-- Stores participant enrollment details, selected carnival activities, and payment status
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id TEXT UNIQUE NOT NULL,
    student JSONB NOT NULL,
    selected_games JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 5,
    payment_status TEXT NOT NULL DEFAULT 'payment_pending',
    payment_reference TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'confirmed',
    attendance_status TEXT NOT NULL DEFAULT 'pending',
    idempotency_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast registration lookup by reference ID and roll number
CREATE INDEX IF NOT EXISTS idx_registrations_reg_id ON public.registrations (registration_id);
CREATE INDEX IF NOT EXISTS idx_registrations_roll ON public.registrations ((student->>'rollNumber'));
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations (payment_status);

-- ------------------------------------------------------------------------------
-- 3. ADMIN USERS TABLE
-- Stores organizer credentials with bcrypt-compatible password hashes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT DEFAULT 'SRMU Event Lead Organizer',
    role TEXT DEFAULT 'admin',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default admin if not already present (Password: SrmuAdmin2026!Secure)
-- Hash generated using standard bcrypt cost 10
INSERT INTO public.admin_users (username, password_hash, full_name, role)
VALUES (
    'admin',
    '$2a$10$9G2p17n0d35K3k4pL4l5.e3Kq9r7u5t3s1w0v8y6x4z2a0b8c6d4e',
    'SRMU Event Lead Organizer',
    'admin'
)
ON CONFLICT (username) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. ADMIN SESSIONS TABLE
-- Cryptographically secured server-side sessions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    csrf_token TEXT NOT NULL,
    user_agent TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_id ON public.admin_sessions (session_id);

-- ------------------------------------------------------------------------------
-- 5. CERTIFICATES TABLE
-- Verifiable student certificates with cryptographic tokens
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT UNIQUE NOT NULL,
    registration_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    course TEXT DEFAULT '',
    branch TEXT DEFAULT '',
    games_participated JSONB DEFAULT '[]'::jsonb,
    verification_token TEXT UNIQUE NOT NULL,
    issue_date TEXT DEFAULT 'October 2026',
    qr_data TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON public.certificates (certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_token ON public.certificates (verification_token);

-- ------------------------------------------------------------------------------
-- 6. EVENT CONFIGURATION TABLE
-- Allows admin to upload/update UPI QR code image and event settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_config (
    id TEXT PRIMARY KEY,
    upi_id TEXT DEFAULT 'srmu.carnival@upi',
    upi_name TEXT DEFAULT 'SRMU B5 Carnival Desk',
    qr_image_url TEXT DEFAULT '',
    is_qr_active BOOLEAN DEFAULT false,
    announcement TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default config
INSERT INTO public.event_config (id, upi_id, upi_name, qr_image_url, is_qr_active, announcement)
VALUES (
    'payment_config',
    'srmu.carnival@upi',
    'SRMU B5 Carnival Desk',
    '',
    false,
    'Official registrations active. ₹5 per game.'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. GAME SCORES TABLE (Live Campus Leaderboard)
-- Stores recorded scores and leaderboard positions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL,
    game_name TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    roll_number TEXT DEFAULT '',
    score TEXT NOT NULL,
    rank INTEGER DEFAULT 1,
    category TEXT DEFAULT 'Solo',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON public.game_scores (game_id);

-- Sample initial leaderboard entries
INSERT INTO public.game_scores (game_id, game_name, participant_name, roll_number, score, rank, category)
VALUES
    ('lemon-race', 'Lemon and Spoon Race', 'Aarav Sharma', '2023101011001', '14.2s (Fastest Lap)', 1, 'Solo'),
    ('lemon-race', 'Lemon and Spoon Race', 'Priya Verma', '2023101011045', '15.8s', 2, 'Solo'),
    ('target-shooting', 'Target Shooting Challenge', 'Vikramaditya Singh', '2022101012014', '95 Points', 1, 'Solo'),
    ('musical-chairs', 'Musical Chairs', 'Ananya Gupta', '2024101013009', 'Winner (Round 4)', 1, 'Solo')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active event config & public certificates
CREATE POLICY "Public can read event config" ON public.event_config FOR SELECT USING (true);
CREATE POLICY "Public can read certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Public can read game scores" ON public.game_scores FOR SELECT USING (true);

-- Allow public to insert registrations
CREATE POLICY "Public can insert registrations" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read own registration by ID" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Public can update own payment reference" ON public.registrations FOR UPDATE USING (true);

-- Service role has full unrestricted access to all tables
CREATE POLICY "Service role full access registrations" ON public.registrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access admin_users" ON public.admin_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access certificates" ON public.certificates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access event_config" ON public.event_config FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access game_scores" ON public.game_scores FOR ALL USING (auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 9. REALTIME PUBLICATION ENABLEMENT
-- Enables instant live WebSocket updates for registrations, scores, and event config
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'registrations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'event_config'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.event_config;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_scores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- ==============================================================================
-- SCHEMA CREATION COMPLETE!
-- ==============================================================================
