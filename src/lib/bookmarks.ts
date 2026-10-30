import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const BOOKMARKS_STORAGE_KEY = 'syncnote_bookmarks'
const DOWNLOADS_STORAGE_KEY = 'syncnote_downloads'

function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function parseStoredList(key: string): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  } catch {
    return []
  }
}

function saveStoredList(key: string, list: string[], eventName: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    localStorage.setItem(key, JSON.stringify(list))
    window.dispatchEvent(new Event(eventName))
  } catch (err) {
    console.error(`Error saving ${key}`, err)
  }
}

export function getBookmarks(): string[] {
  return parseStoredList(BOOKMARKS_STORAGE_KEY)
}

export function isBookmarked(resourceId: string): boolean {
  if (!resourceId) return false
  return getBookmarks().includes(resourceId)
}

export function toggleBookmark(resourceId: string): boolean {
  if (!resourceId) return false
  try {
    const list = getBookmarks()
    const index = list.indexOf(resourceId)
    let added = false
    if (index === -1) {
      list.unshift(resourceId)
      added = true
    } else {
      list.splice(index, 1)
      added = false
    }
    saveStoredList(BOOKMARKS_STORAGE_KEY, list, 'syncnote:bookmarks_changed')

    // Optimistically sync with Supabase if configured and valid UUID
    if (isSupabaseConfigured && isUUID(resourceId)) {
      void syncBookmarkToSupabase(resourceId, added)
    }

    return added
  } catch (err) {
    console.error('Error toggling bookmark', err)
    return false
  }
}

export function removeBookmark(resourceId: string): void {
  if (!resourceId) return
  try {
    const list = getBookmarks().filter(id => id !== resourceId)
    saveStoredList(BOOKMARKS_STORAGE_KEY, list, 'syncnote:bookmarks_changed')

    if (isSupabaseConfigured && isUUID(resourceId)) {
      void syncBookmarkToSupabase(resourceId, false)
    }
  } catch (err) {
    console.error('Error removing bookmark', err)
  }
}

export function getDownloads(): string[] {
  return parseStoredList(DOWNLOADS_STORAGE_KEY)
}

export function addDownload(resourceId: string): void {
  if (!resourceId) return
  try {
    const list = getDownloads()
    if (!list.includes(resourceId)) {
      list.unshift(resourceId)
      saveStoredList(DOWNLOADS_STORAGE_KEY, list, 'syncnote:downloads_changed')

      if (isSupabaseConfigured && isUUID(resourceId)) {
        void syncDownloadToSupabase(resourceId)
      }
    }
  } catch (err) {
    console.error('Error saving download', err)
  }
}

export function removeDownload(resourceId: string): void {
  if (!resourceId) return
  try {
    const list = getDownloads().filter(id => id !== resourceId)
    saveStoredList(DOWNLOADS_STORAGE_KEY, list, 'syncnote:downloads_changed')

    if (isSupabaseConfigured && isUUID(resourceId)) {
      void supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          supabase
            .from('downloads')
            .delete()
            .eq('user_id', data.user.id)
            .eq('resource_id', resourceId)
            .then(() => {})
        }
      })
    }
  } catch (err) {
    console.error('Error removing download', err)
  }
}

async function syncBookmarkToSupabase(resourceId: string, add: boolean): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (add) {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, resource_id: resourceId })
      // Ignore unique constraint violation (already bookmarked)
      if (error && error.code !== '23505') {
        console.warn('Supabase bookmark insert notice:', error.message)
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('resource_id', resourceId)
      if (error) {
        console.warn('Supabase bookmark delete notice:', error.message)
      }
    }
  } catch (e) {
    console.warn('Failed to sync bookmark with Supabase:', e)
  }
}

async function syncDownloadToSupabase(resourceId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('downloads')
      .insert({ user_id: user.id, resource_id: resourceId })
    if (error && error.code !== '23505') {
      console.warn('Supabase download insert notice:', error.message)
    }
  } catch (e) {
    console.warn('Failed to sync download with Supabase:', e)
  }
}

export async function syncUserBookmarksWithSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Fetch remote bookmarks
    const { data: remoteBookmarks, error: bmError } = await supabase
      .from('bookmarks')
      .select('resource_id')
      .eq('user_id', user.id)

    if (!bmError && Array.isArray(remoteBookmarks)) {
      const remoteIds = remoteBookmarks
        .map((b: any) => b.resource_id)
        .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
      const local = getBookmarks()
      const merged = Array.from(new Set([...local, ...remoteIds]))
      if (merged.length !== local.length) {
        saveStoredList(BOOKMARKS_STORAGE_KEY, merged, 'syncnote:bookmarks_changed')
      }

      // Sync any local UUID bookmarks up to Supabase if missing remotely
      const remoteSet = new Set(remoteIds)
      const toUpload = local.filter(id => isUUID(id) && !remoteSet.has(id))
      if (toUpload.length > 0) {
        await supabase
          .from('bookmarks')
          .insert(toUpload.map(id => ({ user_id: user.id, resource_id: id })))
          .then(() => {})
      }
    }

    // 2. Fetch remote downloads
    const { data: remoteDownloads, error: dlError } = await supabase
      .from('downloads')
      .select('resource_id')
      .eq('user_id', user.id)

    if (!dlError && Array.isArray(remoteDownloads)) {
      const remoteDlIds = remoteDownloads
        .map((d: any) => d.resource_id)
        .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
      const localDl = getDownloads()
      const mergedDl = Array.from(new Set([...localDl, ...remoteDlIds]))
      if (mergedDl.length !== localDl.length) {
        saveStoredList(DOWNLOADS_STORAGE_KEY, mergedDl, 'syncnote:downloads_changed')
      }
    }
  } catch (e) {
    console.warn('Could not sync bookmarks from Supabase:', e)
  }
}
