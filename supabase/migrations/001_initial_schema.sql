-- ============================================================
-- SyncNote – Initial Database Schema
-- Apply via Supabase SQL Editor or supabase db push
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  enrollment_no   TEXT NOT NULL UNIQUE,
  course_branch   TEXT NOT NULL,
  current_semester INT DEFAULT 1,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── Subjects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  subject_code    TEXT UNIQUE,
  branch          TEXT NOT NULL,
  semester        INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  description     TEXT,
  syllabus_file_path TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Only admins can modify subjects" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND enrollment_no LIKE 'ADMIN%')
);

-- ─── Resources ────────────────────────────────────────────────────────────────
CREATE TYPE resource_type_enum AS ENUM ('lecture_notes', 'pyq', 'assignment', 'lab_manual', 'reference_material');
CREATE TYPE moderation_status_enum AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS resources (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  subject_id       UUID REFERENCES subjects(id) ON DELETE SET NULL,
  branch           TEXT NOT NULL,
  semester         INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  resource_type    resource_type_enum NOT NULL,
  storage_path     TEXT NOT NULL,
  file_size        BIGINT,
  uploader_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  moderation_status moderation_status_enum DEFAULT 'pending',
  download_count   INT DEFAULT 0,
  academic_year    TEXT,
  tags             TEXT[],
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved resources" ON resources FOR SELECT USING (moderation_status = 'approved');
CREATE POLICY "Uploaders can view own resources" ON resources FOR SELECT USING (uploader_id = auth.uid());
CREATE POLICY "Authenticated users can insert resources" ON resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND uploader_id = auth.uid());

-- ─── Bookmarks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, resource_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (user_id = auth.uid());

-- ─── Downloads ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS downloads (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id  UUID REFERENCES resources(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own downloads" ON downloads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can insert downloads" ON downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Contributions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contributions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id       UUID REFERENCES resources(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL,
  credits_awarded   INT DEFAULT 0,
  status            TEXT DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contributions" ON contributions FOR SELECT USING (user_id = auth.uid());

-- ─── Credit Transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount           INT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend')),
  reference_id     UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, reference_id, transaction_type)
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (user_id = auth.uid());

-- ─── Academic Documents ───────────────────────────────────────────────────────
CREATE TYPE doc_type_enum AS ENUM ('timetable', 'syllabus', 'calendar');

CREATE TABLE IF NOT EXISTS academic_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  document_type doc_type_enum NOT NULL,
  branch        TEXT NOT NULL,
  semester      INT,
  academic_year TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE academic_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view academic documents" ON academic_documents FOR SELECT USING (true);

-- ─── Academic Events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  category    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE academic_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON academic_events FOR SELECT USING (true);

-- ─── Rewards ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  credit_cost INT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active rewards" ON rewards FOR SELECT USING (is_active = TRUE);

-- ─── Reward Redemptions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id    UUID REFERENCES rewards(id),
  credits_spent INT NOT NULL,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own redemptions" ON reward_redemptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can create redemptions" ON reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_resources_semester ON resources(semester);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(moderation_status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);

-- ─── Function: Auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_documents_updated_at BEFORE UPDATE ON academic_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
