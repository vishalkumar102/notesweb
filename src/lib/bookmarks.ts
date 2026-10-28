const BOOKMARKS_STORAGE_KEY = 'syncnote_bookmarks'
const DOWNLOADS_STORAGE_KEY = 'syncnote_downloads'

function getValidResourceIds(): Set<string> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return new Set<string>()
    const raw = localStorage.getItem('syncnote_custom_uploads')
    if (!raw) return new Set<string>()
    const uploads = JSON.parse(raw)
    const set = new Set<string>()
    if (Array.isArray(uploads)) {
      uploads.forEach((r: any) => {
        if (r && r.id) set.add(r.id)
      })
    }
    return set
  } catch {
    return new Set<string>()
  }
}

export function getBookmarks(): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
    if (!raw) return []
    const list: string[] = JSON.parse(raw)
    if (!Array.isArray(list)) return []

    // Filter to only IDs that exist in current resources
    const validIds = getValidResourceIds()
    const validBookmarks = list.filter(id => validIds.has(id))

    if (validBookmarks.length !== list.length) {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(validBookmarks))
      window.dispatchEvent(new Event('syncnote:bookmarks_changed'))
    }
    return validBookmarks
  } catch {
    return []
  }
}

export function isBookmarked(resourceId: string): boolean {
  const list = getBookmarks()
  return list.includes(resourceId)
}

export function toggleBookmark(resourceId: string): boolean {
  try {
    const list = getBookmarks()
    const index = list.indexOf(resourceId)
    let added = false
    if (index === -1) {
      list.push(resourceId)
      added = true
    } else {
      list.splice(index, 1)
      added = false
    }
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new Event('syncnote:bookmarks_changed'))
    return added
  } catch (err) {
    console.error('Error toggling bookmark', err)
    return false
  }
}

export function removeBookmark(resourceId: string): void {
  try {
    const list = getBookmarks().filter(id => id !== resourceId)
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new Event('syncnote:bookmarks_changed'))
  } catch (err) {
    console.error('Error removing bookmark', err)
  }
}

export function getDownloads(): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = localStorage.getItem(DOWNLOADS_STORAGE_KEY)
    if (!raw) return []
    const list: string[] = JSON.parse(raw)
    if (!Array.isArray(list)) return []

    const validIds = getValidResourceIds()
    const validDownloads = list.filter(id => validIds.has(id))

    if (validDownloads.length !== list.length) {
      localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(validDownloads))
      window.dispatchEvent(new Event('syncnote:downloads_changed'))
    }
    return validDownloads
  } catch {
    return []
  }
}

export function addDownload(resourceId: string): void {
  try {
    const list = getDownloads()
    if (!list.includes(resourceId)) {
      list.unshift(resourceId)
      localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(list))
      window.dispatchEvent(new Event('syncnote:downloads_changed'))
    }
  } catch (err) {
    console.error('Error saving download', err)
  }
}

export function removeDownload(resourceId: string): void {
  try {
    const list = getDownloads().filter(id => id !== resourceId)
    localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new Event('syncnote:downloads_changed'))
  } catch (err) {
    console.error('Error removing download', err)
  }
}

