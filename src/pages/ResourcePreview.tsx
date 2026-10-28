import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Download, Bookmark, BookmarkCheck, ArrowLeft, FileText, User, Calendar, Tag, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { formatBytes, formatDate } from '@/lib/utils'
import { isBookmarked as checkIsBookmarked, toggleBookmark as toggleBookmarkStorage, addDownload } from '@/lib/bookmarks'
import { removeNote, useResources } from '@/lib/dataStore'
import toast from 'react-hot-toast'

const TYPE_LABELS: Record<string, string> = {
  lecture_notes: 'Lecture Notes', pyq: 'PYQ', assignment: 'Assignment',
  lab_manual: 'Lab Manual', reference_material: 'Reference Material',
}

import { incrementResourceDownload } from '@/lib/dataStore'

export default function ResourcePreview() {
  const { resourceId } = useParams()
  const { resources: allResources, loading } = useResources()
  const resource = allResources.find(r => r.id === resourceId)
  const [bookmarkState, setBookmarkState] = useState<{ id: string; bookmarked: boolean } | null>(null)
  const [zoom, setZoom] = useState(100)
  const [page, setPage] = useState(1)
  const totalPages = 12 // Demo value
  const navigate = useNavigate()
  const bookmarked = resource
    ? bookmarkState?.id === resource.id
      ? bookmarkState.bookmarked
      : checkIsBookmarked(resource.id)
    : false

  if (!resource) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="card p-8 text-center text-slate-500">
          <p className="font-semibold text-slate-700">{loading ? 'Loading note…' : 'Note not found'}</p>
          {!loading && <Link to="/semester-notes" className="btn btn-primary btn-sm mt-4">Browse notes</Link>}
        </div>
      </div>
    )
  }

  const note = resource

  async function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      try {
        await removeNote(note.id)
        toast.success(`"${note.title}" deleted successfully.`)
        navigate('/semester-notes')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error'
        toast.error(`Could not delete the note: ${message}`)
      }
    }
  }

  function handleDownload() {
    addDownload(note.id)
    incrementResourceDownload(note.id)
    if (note.storage_path) {
      const a = document.createElement('a')
      a.href = note.storage_path
      a.download = `${note.title || 'document'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    toast.success('Download started! File saved to your device.')
  }

  function toggleBookmark() {
    const isNowBookmarked = toggleBookmarkStorage(note.id)
    setBookmarkState({ id: note.id, bookmarked: isNowBookmarked })
    toast.success(isNowBookmarked ? 'Saved to Bookmarks!' : 'Removed from Bookmarks')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link to="/semester-notes" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back
        </Link>
        <nav className="text-xs text-slate-400 flex items-center gap-1">
          <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <Link to="/semester-notes" className="hover:text-indigo-600">Notes</Link>
          <span>/</span>
          <span className="text-slate-600 truncate max-w-[200px]">{resource.title}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PDF Viewer */}
        <div className="lg:col-span-2 space-y-3">
          {/* Toolbar */}
          <div className="card p-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 font-medium truncate flex-1">{resource.title}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm p-1.5"><ChevronLeft size={14} /></button>
              <span className="text-xs text-slate-500 px-2 min-w-[60px] text-center">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm p-1.5"><ChevronRight size={14} /></button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="btn btn-secondary btn-sm p-1.5"><ZoomOut size={14} /></button>
              <span className="text-xs text-slate-500 w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="btn btn-secondary btn-sm p-1.5"><ZoomIn size={14} /></button>
            </div>
          </div>

          {/* PDF Preview Area */}
          <div className="pdf-container min-h-[500px] flex items-center justify-center">
            {resource.storage_path ? (
              <iframe
                src={resource.storage_path}
                className="w-full h-[650px] rounded-xl border border-slate-700 bg-white shadow-inner"
                title={resource.title}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center text-slate-300">
                <FileText size={64} className="opacity-40" />
                <div>
                  <p className="font-semibold text-lg">{resource.title}</p>
                  <p className="text-sm opacity-70 mt-1">{resource.subject?.name}</p>
                  <p className="text-xs opacity-50 mt-3">
                    Connect Supabase Storage to preview PDFs.<br />
                    The file path will be loaded from your database.
                  </p>
                </div>
                <button onClick={handleDownload} className="btn bg-indigo-500 text-white hover:bg-indigo-400 mt-2">
                  <Download size={16} /> Download PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-slate-800 text-base leading-snug">{resource.title}</h2>

            <div className="flex flex-wrap gap-1.5">
              <span className="badge bg-indigo-50 text-indigo-700">{TYPE_LABELS[resource.resource_type]}</span>
              {resource.moderation_status === 'approved' && (
                <span className="badge bg-green-50 text-green-700">✓ Verified</span>
              )}
              <span className="badge bg-slate-100 text-slate-600">Sem {resource.semester}</span>
            </div>

            {resource.description && (
              <p className="text-sm text-slate-500 leading-relaxed">{resource.description}</p>
            )}

            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-slate-400 flex-shrink-0" />
                <span>{formatBytes(resource.file_size ?? 0)} · PDF Document</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={13} className="text-slate-400 flex-shrink-0" />
                <span>Uploaded by <strong className="text-slate-700">{resource.uploader?.full_name}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                <span>{formatDate(resource.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download size={13} className="text-slate-400 flex-shrink-0" />
                <span>{resource.download_count} downloads</span>
              </div>
              {resource.academic_year && (
                <div className="flex items-center gap-2">
                  <Tag size={13} className="text-slate-400 flex-shrink-0" />
                  <span>AY {resource.academic_year}</span>
                </div>
              )}
            </div>

            <hr className="divider" />

            <div className="space-y-2">
              <button onClick={handleDownload} className="btn btn-primary w-full">
                <Download size={16} /> Download PDF
              </button>
              <button onClick={toggleBookmark} className={`btn w-full ${bookmarked ? 'btn-secondary text-indigo-700' : 'btn-outline'}`}>
                {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button onClick={handleDelete} className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 w-full flex items-center justify-center gap-1.5">
                <Trash2 size={15} /> Remove File
              </button>
            </div>
          </div>

          {/* Related */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Related Resources</h3>
            <div className="space-y-2">
              {allResources.filter(r => r.subject_id === resource.subject_id && r.id !== resource.id).slice(0, 3).map(r => (
                <Link key={r.id} to={`/resource/${r.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                  <FileText size={14} className="text-indigo-400 flex-shrink-0" />
                  <span className="text-xs text-slate-600 group-hover:text-indigo-700 transition-colors line-clamp-2">{r.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
