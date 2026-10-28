import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Resource, ResourceType, Subject, Profile } from '@/types'

const NOTES_BUCKET = 'notes'
const RESOURCE_SELECT = '*, subject:subjects(*), uploader:profiles(*)'

type ResourceRow = Omit<Resource, 'subject' | 'uploader' | 'storage_path' | 'subject_id'> & {
  subject_id: string | null
  subject_name: string | null
  storage_path: string
  subject: Subject | null
  uploader: Profile | null
}

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.')
  }
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function toResource(row: ResourceRow): Resource {
  const subjectName = row.subject?.name || row.subject_name || 'General Subject'
  const subjectId = row.subject?.id || row.subject_id || `remote-${slug(`${row.branch}-${row.semester}-${subjectName}`)}`
  const subject: Subject = row.subject ?? {
    id: subjectId,
    name: subjectName,
    subject_code: undefined,
    branch: row.branch,
    semester: row.semester,
    created_at: row.created_at,
  }
  const { data } = supabase.storage.from(NOTES_BUCKET).getPublicUrl(row.storage_path)

  return {
    ...row,
    subject_id: subjectId,
    subject,
    uploader: row.uploader ?? undefined,
    storage_path: data.publicUrl,
  }
}

export async function fetchNotes(): Promise<Resource[]> {
  requireSupabase()
  const { data, error } = await supabase
    .from('resources')
    .select(RESOURCE_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as unknown as ResourceRow[]).map(toResource)
}

export interface NewNote {
  title: string
  description: string
  branch: string
  semester: number
  subjectName: string
  resourceType: ResourceType
  academicYear: string
  tags: string[]
}

export async function uploadNote(file: File, note: NewNote): Promise<Resource> {
  requireSupabase()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Sign in with a Supabase account before uploading notes.')

  const resourceId = crypto.randomUUID()
  const storagePath = `${userData.user.id}/${resourceId}.pdf`
  const { error: storageError } = await supabase.storage
    .from(NOTES_BUCKET)
    .upload(storagePath, file, { contentType: 'application/pdf', upsert: false })

  if (storageError) throw storageError

  const { data, error } = await supabase
    .from('resources')
    .insert({
      id: resourceId,
      title: note.title,
      description: note.description,
      subject_name: note.subjectName,
      branch: note.branch,
      semester: note.semester,
      resource_type: note.resourceType,
      storage_path: storagePath,
      file_size: file.size,
      uploader_id: userData.user.id,
      moderation_status: 'approved',
      download_count: 0,
      academic_year: note.academicYear,
      tags: note.tags,
    })
    .select(RESOURCE_SELECT)
    .single()

  if (error) {
    const { error: cleanupError } = await supabase.storage.from(NOTES_BUCKET).remove([storagePath])
    if (cleanupError) {
      console.error('Could not remove uploaded file after note metadata failed to save', cleanupError)
    }
    throw error
  }

  return toResource(data as unknown as ResourceRow)
}

export async function deleteNote(resourceId: string): Promise<void> {
  requireSupabase()

  const { data, error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId)
    .select('storage_path')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Note could not be found or you do not have permission to delete it.')

  const { error: storageError } = await supabase.storage.from(NOTES_BUCKET).remove([data.storage_path])
  if (storageError) {
    throw new Error(`The note record was deleted, but its stored PDF could not be removed: ${storageError.message}`)
  }
}
