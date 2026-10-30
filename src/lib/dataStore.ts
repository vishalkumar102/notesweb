import { useState, useEffect, useCallback } from 'react'
import type { Resource, Subject } from '@/types'
import { INITIAL_RESOURCES, MOCK_SUBJECTS } from '@/data/mockData'
import { getBookmarks, getDownloads, removeBookmark, removeDownload } from '@/lib/bookmarks'
import { deleteNote, fetchNotes } from '@/lib/notesApi'
import { isSupabaseConfigured } from '@/lib/supabase'
import toast from 'react-hot-toast'

const UPLOADS_STORAGE_KEY = 'syncnote_custom_uploads'
const CREDITS_STORAGE_KEY = 'syncnote_user_credits'
const PLATFORM_DOWNLOADS_KEY = 'syncnote_platform_downloads'

// ─── Credits Store ────────────────────────────────────────────────────────────
export function getUserCredits(): number {
  try {
    const raw = localStorage.getItem(CREDITS_STORAGE_KEY)
    if (raw !== null) {
      const val = parseInt(raw, 10)
      if (!isNaN(val)) {
        // Automatically migrate legacy mock values (1420 base)
        if (val === 1420) {
          const actualCredits = getCustomUploads().length * 150
          localStorage.setItem(CREDITS_STORAGE_KEY, actualCredits.toString())
          return actualCredits
        }
        if (val >= 1420 && (val - 1420) % 150 === 0) {
          const actualCredits = val - 1420
          localStorage.setItem(CREDITS_STORAGE_KEY, actualCredits.toString())
          return actualCredits
        }
        return val
      }
    }
    // Default starting credits based on real uploads (150 per note uploaded, or 0)
    const initialCredits = getCustomUploads().length * 150
    localStorage.setItem(CREDITS_STORAGE_KEY, initialCredits.toString())
    return initialCredits
  } catch {
    return getCustomUploads().length * 150
  }
}

export function addCredits(amount: number): number {
  try {
    const current = getUserCredits()
    const next = current + amount
    localStorage.setItem(CREDITS_STORAGE_KEY, next.toString())
    window.dispatchEvent(new Event('syncnote:credits_changed'))
    return next
  } catch {
    return getUserCredits()
  }
}

// ─── Resources Store ──────────────────────────────────────────────────────────
export function getCustomUploads(): Resource[] {
  try {
    const raw = localStorage.getItem(UPLOADS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((r: any) => {
      if (!r.subject || !r.subject.name) {
        const subName = r.subject_name || r.title || 'General Subject'
        return {
          ...r,
          subject: {
            id: r.subject_id || 'subj_' + String(subName).toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: subName,
            subject_code: r.subject_code || '',
            branch: r.branch || 'B.Tech CSE/IT',
            semester: r.semester || 1,
            description: r.description || `Study material for ${subName}`,
            created_at: r.created_at || new Date().toISOString(),
          }
        }
      }
      return r
    })
  } catch {
    return []
  }
}

export function getAllResources(): Resource[] {
  const custom = getCustomUploads()
  return [...custom, ...INITIAL_RESOURCES]
}

export async function removeNote(resourceId: string): Promise<void> {
  if (isSupabaseConfigured) {
    await deleteNote(resourceId)
  } else if (!deleteCustomUpload(resourceId)) {
    throw new Error('Note could not be found in local storage.')
  }
  removeBookmark(resourceId)
  removeDownload(resourceId)
  window.dispatchEvent(new Event('syncnote:resources_changed'))
}

export function saveCustomUpload(resource: Resource): void {
  try {
    const current = getCustomUploads()
    current.unshift(resource)
    localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(current))
    // Award +150 credits for sharing notes
    addCredits(150)
    window.dispatchEvent(new Event('syncnote:resources_changed'))
  } catch (err) {
    console.error('Failed to save upload', err)
  }
}

export function deleteCustomUpload(identifier: string): boolean {
  try {
    const raw = localStorage.getItem(UPLOADS_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return false
    const q = identifier.trim().toLowerCase()
    const updated = parsed.filter((r: any) => {
      const matchId = r.id && (r.id === identifier || r.id.toLowerCase() === q)
      const matchTitle = r.title && r.title.trim().toLowerCase() === q
      return !matchId && !matchTitle
    })
    localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(updated))
    // Recalculate credits to match remaining uploads
    const remainingCredits = updated.length * 150
    localStorage.setItem(CREDITS_STORAGE_KEY, remainingCredits.toString())
    window.dispatchEvent(new Event('syncnote:resources_changed'))
    window.dispatchEvent(new Event('syncnote:credits_changed'))
    return true
  } catch (err) {
    console.error('Failed to delete upload', err)
    return false
  }
}

export function incrementResourceDownload(resourceId: string): void {
  try {
    // Increment in custom uploads if it's there
    const custom = getCustomUploads()
    const match = custom.find(r => r.id === resourceId)
    if (match) {
      match.download_count = (match.download_count || 0) + 1
      localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(custom))
    }
    // Track total downloads
    const currentPlatform = getPlatformDownloadsCount()
    localStorage.setItem(PLATFORM_DOWNLOADS_KEY, (currentPlatform + 1).toString())
    window.dispatchEvent(new Event('syncnote:resources_changed'))
  } catch (err) {
    console.error('Failed to increment download count', err)
  }
}

export function getPlatformDownloadsCount(): number {
  try {
    const realDownloads = getDownloads().length
    const raw = localStorage.getItem(PLATFORM_DOWNLOADS_KEY)
    if (raw !== null) {
      const val = parseInt(raw, 10)
      if (!isNaN(val)) {
        // If legacy mock count or if user has 0 downloads, keep it clean and synced
        if (val >= 48250 || realDownloads === 0) {
          localStorage.setItem(PLATFORM_DOWNLOADS_KEY, realDownloads.toString())
          return realDownloads
        }
        return Math.max(val, realDownloads)
      }
    }
    localStorage.setItem(PLATFORM_DOWNLOADS_KEY, realDownloads.toString())
    return realDownloads
  } catch {
    return getDownloads().length
  }
}

// ─── Dynamic Subjects Store ───────────────────────────────────────────────────
export function getAllSubjects(resources: Resource[] = getAllResources()): Subject[] {
  const subjects: Subject[] = []
  const seen = new Set(MOCK_SUBJECTS.map(subject =>
    `${subject.name.toLowerCase().trim()}|${subject.branch.toLowerCase().trim()}|${subject.semester}`
  ))

  for (const r of resources) {
    if (r.subject && r.subject.name) {
      const key = `${r.subject.name.toLowerCase().trim()}|${r.subject.branch.toLowerCase().trim()}|${r.subject.semester}`
      if (seen.has(key)) continue
      seen.add(key)
      subjects.push(r.subject)
    }
  }
  return [...MOCK_SUBJECTS, ...subjects]
}

export function getSubjectCountForSemester(semester: number): number {
  return getAllSubjects().filter(s => s.semester === semester).length
}

// ─── React Hook for Live Data ─────────────────────────────────────────────────
export function useLiveSyncNoteData(userId?: string) {
  const { resources } = useResources()
  const [credits, setCredits] = useState<number>(() => getUserCredits())
  const [bookmarks, setBookmarks] = useState<string[]>(() => getBookmarks())
  const [downloads, setDownloads] = useState<string[]>(() => getDownloads())
  const [platformDownloads, setPlatformDownloads] = useState<number>(() => getPlatformDownloadsCount())

  useEffect(() => {
    function handleCredits() {
      setCredits(getUserCredits())
    }
    function handleBookmarks() {
      setBookmarks(getBookmarks())
    }
    function handleDownloads() {
      setDownloads(getDownloads())
      setPlatformDownloads(getPlatformDownloadsCount())
    }

    window.addEventListener('syncnote:credits_changed', handleCredits)
    window.addEventListener('syncnote:bookmarks_changed', handleBookmarks)
    window.addEventListener('syncnote:downloads_changed', handleDownloads)
    window.addEventListener('storage', handleDownloads)

    return () => {
      window.removeEventListener('syncnote:credits_changed', handleCredits)
      window.removeEventListener('syncnote:bookmarks_changed', handleBookmarks)
      window.removeEventListener('syncnote:downloads_changed', handleDownloads)
      window.removeEventListener('storage', handleDownloads)
    }
  }, [])

  const totalMaterials = resources.length
  const myUploadsCount = isSupabaseConfigured
    ? resources.filter(resource => resource.uploader_id === userId).length
    : getCustomUploads().length

  return {
    resources,
    credits,
    bookmarks,
    downloads,
    platformDownloads,
    totalMaterials,
    myUploadsCount,
  }
}

export function useResources() {
  const [resources, setResources] = useState<Resource[]>(() =>
    isSupabaseConfigured ? [] : getAllResources()
  )
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setResources(getAllResources())
      return
    }

    try {
      setResources(await fetchNotes())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      toast.error(`Could not load notes: ${message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (isSupabaseConfigured) {
      fetchNotes()
        .then(notes => {
          if (!cancelled) setResources(notes)
        })
        .catch(error => {
          if (cancelled) return
          const message = error instanceof Error ? error.message : 'Unexpected error'
          toast.error(`Could not load notes: ${message}`)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    const handleRefresh = () => {
      if (isSupabaseConfigured) setLoading(true)
      void refresh()
    }
    window.addEventListener('syncnote:resources_changed', handleRefresh)
    window.addEventListener('storage', handleRefresh)
    return () => {
      cancelled = true
      window.removeEventListener('syncnote:resources_changed', handleRefresh)
      window.removeEventListener('storage', handleRefresh)
    }
  }, [refresh])

  return { resources, refresh, loading }
}
