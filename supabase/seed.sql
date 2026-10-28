-- ============================================================
-- SyncNote – Seed Data (Semesters 1 to 7 - Guru Ghasidas Vishwavidyalaya)
-- Run AFTER applying 001_initial_schema.sql in Supabase SQL Editor
-- ============================================================

-- ─── Subjects (Semesters 1 to 7) ─────────────────────────────────────────────
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
ON CONFLICT DO NOTHING;

-- ─── Academic Events ──────────────────────────────────────────────────────────
INSERT INTO academic_events (title, description, event_date, category) VALUES
  ('Mid-Semester Examination',   'Semester mid-term examinations begin',      '2024-11-04', 'exam'),
  ('Diwali Holidays',            'University closed for Diwali celebrations', '2024-11-01', 'holiday'),
  ('Course Registration Deadline','Last date for semester course registration','2024-11-10', 'registration'),
  ('End-Semester Examination',   'Final examinations begin',                  '2024-12-02', 'exam'),
  ('Annual Tech Fest',           'Inter-college technical festival',          '2024-11-22', 'academic')
ON CONFLICT DO NOTHING;

-- ─── Rewards ──────────────────────────────────────────────────────────────────
INSERT INTO rewards (title, description, credit_cost) VALUES
  ('Amazon Gift Card – ₹500',     'Redeem SyncCredits for an Amazon gift voucher.',            2000),
  ('Course Completion Certificate','Official contribution certificate from the platform.',      1500),
  ('Premium Study Material Pack', 'Curated set of advanced study materials.',                  1000),
  ('SyncNote Pro Badge',          'Exclusive profile badge for top contributors.',               800),
  ('Stationery Kit',              'Premium stationery set delivered to your address.',           500),
  ('LinkedIn Shoutout',           'Recognition post on SyncNote official LinkedIn.',             300)
ON CONFLICT DO NOTHING;
