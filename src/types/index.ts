// ─── Auth & Profile ───────────────────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string
  enrollment_no: string
  course_branch: string
  current_semester?: number
  avatar_url?: string
  created_at: string
  updated_at: string
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
export interface Subject {
  id: string
  name: string
  subject_code?: string
  branch: string
  semester: number
  description?: string
  syllabus_file_path?: string
  created_at: string
}

// ─── Resources ────────────────────────────────────────────────────────────────
export type ResourceType =
  | 'lecture_notes'
  | 'pyq'
  | 'assignment'
  | 'lab_manual'
  | 'reference_material'

export type ModerationStatus = 'pending' | 'approved' | 'rejected'

export interface Resource {
  id: string
  title: string
  description?: string
  subject_name?: string
  subject_id: string
  subject?: Subject
  branch: string
  semester: number
  resource_type: ResourceType
  storage_path: string
  file_size?: number
  uploader_id: string
  uploader?: Profile
  moderation_status: ModerationStatus
  download_count: number
  academic_year?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export interface Bookmark {
  id: string
  user_id: string
  resource_id: string
  resource?: Resource
  created_at: string
}

// ─── Downloads ────────────────────────────────────────────────────────────────
export interface Download {
  id: string
  user_id: string
  resource_id: string
  resource?: Resource
  downloaded_at: string
}

// ─── Contributions ────────────────────────────────────────────────────────────
export interface Contribution {
  id: string
  user_id: string
  resource_id: string
  contribution_type: string
  credits_awarded: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

// ─── Credit Transactions ──────────────────────────────────────────────────────
export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  transaction_type: 'earn' | 'spend'
  reference_id?: string
  created_at: string
}

// ─── Academic Documents ───────────────────────────────────────────────────────
export type DocumentType = 'timetable' | 'syllabus' | 'calendar'

export interface AcademicDocument {
  id: string
  title: string
  document_type: DocumentType
  branch: string
  semester?: number
  academic_year: string
  storage_path: string
  created_at: string
  updated_at: string
}

// ─── Academic Events ──────────────────────────────────────────────────────────
export interface AcademicEvent {
  id: string
  title: string
  description?: string
  event_date: string
  category: 'exam' | 'holiday' | 'registration' | 'academic'
  created_at: string
}

// ─── Misc ─────────────────────────────────────────────────────────────────────
export interface SearchResult {
  type: 'resource' | 'subject' | 'semester'
  id: string
  title: string
  subtitle?: string
  href: string
}
