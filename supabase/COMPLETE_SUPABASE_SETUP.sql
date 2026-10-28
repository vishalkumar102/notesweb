-- =============================================================================
-- SyncNote: Complete 1-Click Database Setup & Seed
-- Target Project: https://nrdjarmwgrxbjfpxysuk.supabase.co
-- Instructions: Copy and paste this entire script into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nrdjarmwgrxbjfpxysuk/sql/new
-- Then click "Run".
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Safe Enum Types ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type_enum') THEN
    CREATE TYPE resource_type_enum AS ENUM ('lecture_notes', 'pyq', 'assignment', 'lab_manual', 'reference_material');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status_enum') THEN
    CREATE TYPE moderation_status_enum AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_type_enum') THEN
    CREATE TYPE doc_type_enum AS ENUM ('timetable', 'syllabus', 'calendar');
  END IF;
END $$;

-- ─── 1. Profiles Table ────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── 2. Subjects Table ────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Anyone can view subjects" ON subjects;
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify subjects" ON subjects;
CREATE POLICY "Only admins can modify subjects" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND enrollment_no LIKE 'ADMIN%')
);

-- ─── 3. Resources Table ───────────────────────────────────────────────────────
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
  moderation_status moderation_status_enum DEFAULT 'approved',
  download_count   INT DEFAULT 0,
  academic_year    TEXT,
  tags             TEXT[],
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved resources" ON resources;
CREATE POLICY "Anyone can view approved resources" ON resources FOR SELECT USING (moderation_status = 'approved');

DROP POLICY IF EXISTS "Uploaders can view own resources" ON resources;
CREATE POLICY "Uploaders can view own resources" ON resources FOR SELECT USING (uploader_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert resources" ON resources;
CREATE POLICY "Authenticated users can insert resources" ON resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND uploader_id = auth.uid());

-- ─── 4. Bookmarks Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, resource_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bookmarks" ON bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (user_id = auth.uid());

-- ─── 5. Downloads Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS downloads (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id  UUID REFERENCES resources(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own downloads" ON downloads;
CREATE POLICY "Users can view own downloads" ON downloads FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert downloads" ON downloads;
CREATE POLICY "Authenticated users can insert downloads" ON downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── 6. Contributions Table ───────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Users can view own contributions" ON contributions;
CREATE POLICY "Users can view own contributions" ON contributions FOR SELECT USING (user_id = auth.uid());

-- ─── 7. Credit Transactions Table ─────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (user_id = auth.uid());

-- ─── 8. Academic Documents Table ──────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Anyone can view academic documents" ON academic_documents;
CREATE POLICY "Anyone can view academic documents" ON academic_documents FOR SELECT USING (true);

-- ─── 9. Academic Events Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  category    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE academic_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view events" ON academic_events;
CREATE POLICY "Anyone can view events" ON academic_events FOR SELECT USING (true);

-- ─── 10. Rewards Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL UNIQUE,
  description TEXT,
  credit_cost INT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
CREATE POLICY "Anyone can view active rewards" ON rewards FOR SELECT USING (is_active = TRUE);

-- ─── 11. Reward Redemptions Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id    UUID REFERENCES rewards(id),
  credits_spent INT NOT NULL,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own redemptions" ON reward_redemptions;
CREATE POLICY "Users can view own redemptions" ON reward_redemptions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create redemptions" ON reward_redemptions;
CREATE POLICY "Authenticated users can create redemptions" ON reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── 12. Storage Bucket for Uploaded Materials ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view resources bucket" ON storage.objects;
CREATE POLICY "Public can view resources bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Authenticated users can upload to resources bucket" ON storage.objects;
CREATE POLICY "Authenticated users can upload to resources bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

-- ─── 13. Helpful Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_resources_semester ON resources(semester);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(moderation_status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);

-- ─── 14. Trigger Function ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_academic_documents_updated_at ON academic_documents;
CREATE TRIGGER update_academic_documents_updated_at BEFORE UPDATE ON academic_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 15. Seed Data: Semesters 1 to 7 Subjects ────────────────────────────────
INSERT INTO subjects (name, subject_code, branch, semester, description) VALUES
  -- Semester 1
  ('MATHEMATICS-I', 'MA201TBS01', 'B.Tech CSE', 1, 'Calculus, matrices, linear algebra, sequences, and differential equations.'),
  ('PHYSICS', 'PH201TBS02', 'B.Tech CSE', 1, 'Wave optics, lasers, fiber optics, quantum mechanics, and electromagnetic theory.'),
  ('BASIC ELECTRICAL & ELECTRONICS ENGINEERING', 'EC201TES01', 'B.Tech CSE', 1, 'DC & AC circuit laws, transformers, electrical machines, semiconductor diodes, and BJTs.'),
  ('INTRODUCTION TO INFORMATION TECHNOLOGIES', 'IT201TES02', 'B.Tech CSE', 1, 'Computer systems, algorithms, problem solving, networking fundamentals, and IT tools.'),
  ('ENGLISH COMMUNICATION', 'EN201THS01', 'B.Tech CSE', 1, 'Technical writing, communication skills, vocabulary development, and presentation skills.'),

  -- Semester 2
  ('MATHEMATICS-II', 'MA202TBS03', 'B.Tech CSE', 2, 'Multivariable calculus, vector calculus, differential equations, and complex variables.'),
  ('CHEMISTRY', 'CY202TBS04', 'B.Tech CSE', 2, 'Atomic structure, chemical bonding, thermodynamics, electrochemistry, and engineering materials.'),
  ('ENGINEERING MECHANICS', 'CE202TES03', 'B.Tech CSE', 2, 'Statics and dynamics, force systems, friction, centroids, moment of inertia, and kinematics.'),
  ('COMPUTER PROGRAMMING', 'CS202TES04', 'B.Tech CSE', 2, 'Problem solving using C/C++, data types, control flow, functions, arrays, pointers, and structures.'),
  ('BASIC CIVIL & MECHANICAL ENGINEERING', 'CM202TES05', 'B.Tech CSE', 2, 'Surveying, building materials, prime movers, internal combustion engines, and power transmission.'),
  ('INDIAN CONSTITUTION', 'LW202TMC01', 'B.Tech CSE', 2, 'Constitutional history, fundamental rights, directive principles, governance, and judiciary overview.'),

  -- Semester 3
  ('Internet Of Things', 'CSUCTT1', 'B.Tech CSE', 3, 'IoT architecture, sensing, actuation, wireless sensor networks, embedded controllers, and IoT cloud platforms.'),
  ('IT workshop', 'CSUCTT2', 'B.Tech CSE', 3, 'Practical computing tools, command-line utilities, Python scripting, hardware assembly, and networking essentials.'),
  ('Digital logic & Design', 'CSUCTT3', 'B.Tech CSE', 3, 'Boolean algebra, combinational and sequential logic circuits, flip-flops, counters, registers, and memory design.'),
  ('Mathematics III (Numerical Methods)', 'CSUCTE1', 'B.Tech CSE', 3, 'Solutions of algebraic and transcendental equations, interpolation, numerical integration, and numerical solutions of ODEs.'),
  ('System Software', 'CSUCTK1', 'B.Tech CSE', 3, 'Assemblers, macro processors, linkers, loaders, device drivers, and system software architecture.'),
  ('Management Information System', 'CSUCTK2', 'B.Tech CSE', 3, 'Enterprise information systems, decision support systems, database management in organizations, and business IT strategies.'),
  ('Introduction to Web Technology', 'CSUCTK3', 'B.Tech CSE', 3, 'HTML5, CSS3, JavaScript, DOM manipulation, responsive design, HTTP protocols, and server-client basics.'),

  -- Semester 4
  ('Discrete Mathematics', 'CSUDTT1', 'B.Tech CSE', 4, 'Sets, relations, functions, propositional logic, graph theory, trees, combinatorics, and algebraic structures.'),
  ('Operating System', 'CSUDTT2', 'B.Tech CSE', 4, 'Process management, CPU scheduling, synchronization, deadlocks, memory management, virtual memory, and file systems.'),
  ('Data Structure & Algorithms', 'CSUDTT3', 'B.Tech CSE', 4, 'Arrays, linked lists, stacks, queues, trees, graphs, sorting, searching algorithms, and asymptotic time complexity.'),
  ('Electronic Device & Circuits', 'CSUDTK1', 'B.Tech CSE', 4, 'Semiconductor physics, diode circuits, BJT/FET amplifiers, frequency response, feedback amplifiers, and oscillators.'),
  ('Computational science', 'CSUDTK2', 'B.Tech CSE', 4, 'Scientific computing, numerical simulations, modeling physical systems, matrix computations, and optimization methods.'),
  ('Information Theory and Coding', 'CSUDTK3', 'B.Tech CSE', 4, 'Information measure, entropy, source coding, channel capacity, error-detecting and error-correcting codes, and cryptography basics.'),

  -- Semester 5
  ('Relational Database Management System', 'CSUETT1', 'B.Tech CSE', 5, 'Relational model, SQL, normalization, transaction processing, concurrency control, and database indexing.'),
  ('Parallel Computing', 'CSUETT2', 'B.Tech CSE', 5, 'Parallel architectures, multi-threading, OpenMP, MPI, GPU computing, and parallel algorithm design.'),
  ('Formal Language and Automata Theory', 'CSUETT3', 'B.Tech CSE', 5, 'Finite automata, regular expressions, context-free grammars, pushdown automata, Turing machines, and computability.'),
  ('Microprocessor and Interfaces', 'CSUETK1', 'B.Tech CSE', 5, '8085/8086 architecture, assembly language programming, memory interfacing, I/O ports, and interrupt controllers.'),
  ('Software Engineering', 'CSUETK2', 'B.Tech CSE', 5, 'SDLC models, Agile/Scrum methodologies, requirements engineering, software architecture, and project estimation.'),
  ('Multimedia System Design', 'CSUETK3', 'B.Tech CSE', 5, 'Digital audio, image and video processing, compression algorithms (JPEG/MPEG), multimedia networking, and streaming.'),
  ('Software Testing and Quality Assurance', 'CSUETK4', 'B.Tech CSE', 5, 'Unit testing, integration testing, black-box & white-box test design, test automation, and ISO/CMMI quality standards.'),
  ('Distributed System', 'CSUETK5', 'B.Tech CSE', 5, 'Distributed architectures, RPC/RMI, clock synchronization, mutual exclusion, consensus algorithms, and fault tolerance.'),
  ('Information Retrieval Systems', 'CSUETK6', 'B.Tech CSE', 5, 'Inverted indexes, Boolean and vector space models, web search architectures, crawling, PageRank, and text classification.'),

  -- Semester 6
  ('Design and Analysis of Algorithms', 'CSUFTT1', 'B.Tech CSE', 6, 'Divide and conquer, greedy methods, dynamic programming, backtracking, branch & bound, NP-completeness, and graph algorithms.'),
  ('Java', 'CSUFTT2', 'B.Tech CSE', 6, 'Core Java, OOP principles, inheritance, multithreading, exception handling, Java collections framework, and JDBC.'),
  ('Artificial Intelligence', 'CSUFTT3', 'B.Tech CSE', 6, 'Informed & uninformed search strategies, game playing, knowledge representation, propositional logic, and expert systems.'),
  ('Digital Image Processing', 'CSUFTK1', 'B.Tech CSE', 6, 'Image representation, spatial filtering, image enhancement, histogram equalization, edge detection, and morphological operations.'),
  ('Computer Graphics', 'CSUFTK2', 'B.Tech CSE', 6, 'Raster scan algorithms, line & circle generation, 2D/3D transformations, viewing pipeline, clipping, and rendering.'),
  ('Mobile Communication', 'CSUFTK3', 'B.Tech CSE', 6, 'Cellular network concepts, GSM architecture, handover strategies, CDMA/OFDM, 4G/5G technologies, and wireless protocols.'),
  ('Robotics', 'CSUFTK4', 'B.Tech CSE', 6, 'Robot kinematics, dynamics, trajectory planning, sensors & actuators, robot vision, and control algorithms.'),
  ('Visual Basic.Net', 'CSUFTK5', 'B.Tech CSE', 6, '.NET framework architecture, VB.NET syntax, Windows forms, event-driven programming, ADO.NET, and component design.'),
  ('Big Data Analysis', 'CSUFTK6', 'B.Tech CSE', 6, 'Hadoop ecosystem, HDFS, MapReduce architecture, Apache Spark, NoSQL data stores, and big data streaming analytics.'),

  -- Semester 7
  ('Compiler Design', 'CSUGTT1', 'B.Tech CSE', 7, 'Lexical analysis, syntax analysis, LL/LR parsing, syntax-directed translation, intermediate code generation, and optimization.'),
  ('Cloud Computing', 'CSUGTT2', 'B.Tech CSE', 7, 'Cloud service models (IaaS/PaaS/SaaS), virtualization, hypervisors, AWS/Azure architectures, and cloud security.'),
  ('Network Security', 'CSUGTK1', 'B.Tech CSE', 7, 'Cryptography, symmetric & asymmetric ciphers, digital signatures, firewalls, IPsec, SSL/TLS, and intrusion detection systems.'),
  ('Wireless Sensor Network', 'CSUGTK2', 'B.Tech CSE', 7, 'Sensor node architecture, MAC protocols, routing algorithms for WSNs, localization, power management, and IoT sensor setups.'),
  ('TCP/IP Internetworking', 'CSUGTK3', 'B.Tech CSE', 7, 'Internet protocol architecture, IP addressing, subnetting, ARP/RARP, ICMP, TCP flow/congestion control, and routing protocols.'),
  ('Enterprise Resource Management', 'CSUGTK4', 'B.Tech CSE', 7, 'ERP system architecture, business process re-engineering (BPR), supply chain management, CRM, and ERP lifecycle implementation.'),
  ('Soft Computing', 'CSUGTK5', 'B.Tech CSE', 7, 'Fuzzy sets, fuzzy logic, artificial neural networks, backpropagation, genetic algorithms, and neuro-fuzzy hybrid systems.'),
  ('Data Mining', 'CSUGTK6', 'B.Tech CSE', 7, 'Data warehousing, OLAP, association rule mining (Apriori), classification, clustering algorithms (K-Means/DBSCAN), and web mining.'),
  ('Machine Learning', 'CSUGTK7', 'B.Tech CSE', 7, 'Supervised & unsupervised learning, linear & logistic regression, SVMs, decision trees, random forests, and deep neural nets.')
ON CONFLICT (subject_code) DO NOTHING;

-- ─── 16. Seed Data: Academic Events ───────────────────────────────────────────
INSERT INTO academic_events (title, description, event_date, category) VALUES
  ('Mid-Semester Examination',   'Semester mid-term examinations begin',      '2024-11-04', 'exam'),
  ('Diwali Holidays',            'University closed for Diwali celebrations', '2024-11-01', 'holiday'),
  ('Course Registration Deadline','Last date for semester course registration','2024-11-10', 'registration'),
  ('End-Semester Examination',   'Final examinations begin',                  '2024-12-02', 'exam'),
  ('Annual Tech Fest',           'Inter-college technical festival',          '2024-11-22', 'academic')
ON CONFLICT DO NOTHING;

-- ─── 17. Seed Data: Rewards ───────────────────────────────────────────────────
INSERT INTO rewards (title, description, credit_cost) VALUES
  ('Amazon Gift Card – ₹500',     'Redeem SyncCredits for an Amazon gift voucher.',            2000),
  ('Course Completion Certificate','Official contribution certificate from the platform.',      1500),
  ('Premium Study Material Pack', 'Curated set of advanced study materials.',                  1000),
  ('SyncNote Pro Badge',          'Exclusive profile badge for top contributors.',               800),
  ('Stationery Kit',              'Premium stationery set delivered to your address.',           500),
  ('LinkedIn Shoutout',           'Recognition post on SyncNote official LinkedIn.',             300)
ON CONFLICT (title) DO NOTHING;

-- ─── Notes PDF Storage ────────────────────────────────────────────────────────
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS subject_name TEXT;

ALTER TABLE public.resources
  ALTER COLUMN moderation_status SET DEFAULT 'approved';

DROP POLICY IF EXISTS "Authenticated users can insert resources" ON public.resources;
CREATE POLICY "Authenticated users can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND uploader_id = auth.uid());

DROP POLICY IF EXISTS "Uploaders can delete own resources" ON public.resources;
CREATE POLICY "Uploaders can delete own resources"
  ON public.resources FOR DELETE
  USING (uploader_id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('notes', 'notes', TRUE, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read note files" ON storage.objects;
CREATE POLICY "Public can read note files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes');

DROP POLICY IF EXISTS "Users can upload notes to their own folder" ON storage.objects;
CREATE POLICY "Users can upload notes to their own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'notes' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users can delete notes from their own folder" ON storage.objects;
CREATE POLICY "Users can delete notes from their own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notes' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
