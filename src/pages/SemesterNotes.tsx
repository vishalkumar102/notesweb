import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search, Download, Bookmark, FileText, Upload, Filter, Trash2 } from 'lucide-react'
import { SEMESTERS } from '@/data/mockData'
import { incrementResourceDownload, removeNote, useResources } from '@/lib/dataStore'
import { getBookmarks, toggleBookmark as toggleBookmarkStorage, addDownload } from '@/lib/bookmarks'
import { formatBytes, timeAgo } from '@/lib/utils'
import type { Resource } from '@/types'
import toast from 'react-hot-toast'

const TYPE_COLORS: Record<string, string> = {
  lecture_notes: 'bg-indigo-50 text-indigo-700',
  pyq: 'bg-amber-50 text-amber-700',
  lab_manual: 'bg-teal-50 text-teal-700',
  assignment: 'bg-violet-50 text-violet-700',
  reference_material: 'bg-slate-100 text-slate-700',
}

const TYPE_LABELS: Record<string, string> = {
  lecture_notes: 'Lecture Notes',
  pyq: 'PYQ',
  lab_manual: 'Lab Manual',
  assignment: 'Assignment',
  reference_material: 'Reference',
}

export default function SemesterNotes() {
  const [activeSem, setActiveSem] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')
  const { resources, refresh } = useResources()
  const [bookmarks, setBookmarks] = useState<string[]>(() => getBookmarks())

  useEffect(() => {
    function handleBookmarks() {
      setBookmarks(getBookmarks())
    }

    window.addEventListener('syncnote:bookmarks_changed', handleBookmarks)

    return () => {
      window.removeEventListener('syncnote:bookmarks_changed', handleBookmarks)
    }
  }, [])

  function handleToggleBookmark(resourceId: string, title: string) {
    const isNowBookmarked = toggleBookmarkStorage(resourceId)
    setBookmarks(getBookmarks())
    toast.success(isNowBookmarked ? `Bookmarked "${title}"` : `Removed "${title}" from bookmarks`)
  }

  async function handleDeleteResource(resourceId: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      await removeNote(resourceId)
      await refresh()
      toast.success(`"${title}" deleted successfully.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      toast.error(`Could not delete "${title}": ${message}`)
    }
  }

  function handleDownload(resource: Resource) {
    addDownload(resource.id)
    incrementResourceDownload(resource.id)
    if (resource.storage_path) {
      const a = document.createElement('a')
      a.href = resource.storage_path
      a.download = `${resource.title || 'document'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    toast.success(`Downloading "${resource.title}"`)
  }

  // Filter resources based on active semester and search query
  const filteredResources = resources.filter(r => {
    if (activeSem !== 'all' && r.semester !== activeSem) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = r.title.toLowerCase().includes(q)
      const matchSubject = r.subject?.name?.toLowerCase().includes(q) || false
      const matchCode = r.subject?.subject_code?.toLowerCase().includes(q) || false
      const matchDesc = r.description?.toLowerCase().includes(q) || false
      if (!matchTitle && !matchSubject && !matchCode && !matchDesc) return false
    }
    return true
  })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      {/* Page Header */}
      <div>
        <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">Study Materials</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Study Materials &amp; Notes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse syllabus notes, previous year question papers, and resources shared by students.
            </p>
          </div>
          <Link
            to="/upload"
            className="btn btn-primary self-start sm:self-auto py-2.5 px-4 text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Upload size={14} /> Upload Study Material
          </Link>
        </div>
      </div>

      {/* Controls Bar: Search & Semester Pills */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes by title, subject, or code…"
              className="form-input pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {/* Semester Filter Pills */}
        <div className="flex gap-2 flex-wrap items-center pt-1">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter size={12} /> Semester:
          </span>
          <button
            type="button"
            onClick={() => setActiveSem('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeSem === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            All Semesters ({resources.length})
          </button>
          {SEMESTERS.map(s => {
            const count = resources.filter(r => r.semester === s).length
            return (
              <button
                key={s}
                type="button"
                onClick={() => setActiveSem(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  activeSem === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                Semester {s} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Study Materials Grid or Empty State */}
      {filteredResources.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 max-w-md mx-auto my-8 space-y-3">
          <BookOpen size={44} className="mx-auto opacity-35 text-slate-400" />
          <p className="font-semibold text-slate-700 text-base">
            {resources.length === 0 ? 'No study materials uploaded yet' : 'No materials match your filter'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            {resources.length === 0
              ? 'Be the first to share notes, assignments, or PYQs with your classmates!'
              : 'Try clearing your search query or switching to another semester.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {resources.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setActiveSem('all')
                }}
                className="btn btn-secondary btn-sm"
              >
                Reset Filters
              </button>
            )}
            <Link
              to="/upload"
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
            >
              <Upload size={13} /> Upload Material
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Showing {filteredResources.length} {filteredResources.length === 1 ? 'study material' : 'study materials'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map(resource => {
              const isBookmarked = bookmarks.includes(resource.id)
              return (
                <div key={resource.id} className="card p-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                        <FileText size={18} className="text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm leading-snug truncate group-hover:text-indigo-700 transition-colors" title={resource.title}>
                          {resource.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {resource.subject?.name || 'General Subject'} · Semester {resource.semester}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`badge ${TYPE_COLORS[resource.resource_type] ?? 'bg-slate-50 text-slate-700'} text-[11px]`}>
                            {TYPE_LABELS[resource.resource_type] || resource.resource_type}
                          </span>
                          {resource.file_size ? (
                            <span className="text-xs text-slate-400">{formatBytes(resource.file_size)}</span>
                          ) : null}
                          <span className="text-xs text-slate-400">{timeAgo(resource.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {resource.description && (
                      <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-md">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Download size={12} /> {resource.download_count || 0}
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-[120px]">
                      by {resource.uploader?.full_name || 'Student'}
                    </span>
                    <div className="ml-auto flex gap-1.5">
                      <Link to={`/resource/${resource.id}`} className="btn btn-sm btn-outline py-1 px-2.5 text-xs">
                        Preview
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownload(resource)}
                        className="btn btn-sm btn-secondary py-1 px-2 text-xs flex items-center gap-1"
                        title="Download note"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(resource.id, resource.title)}
                        className={`btn btn-sm py-1 px-2 transition-colors ${
                          isBookmarked
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300'
                            : 'btn-secondary text-slate-500'
                        }`}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this note'}
                      >
                        <Bookmark size={12} className={isBookmarked ? 'fill-indigo-600' : ''} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(resource.id, resource.title)}
                        className="btn btn-sm btn-secondary py-1 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
