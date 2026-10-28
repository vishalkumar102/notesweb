import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download, Bookmark, BookmarkX, FileText, ExternalLink, HardDrive, BookOpen } from 'lucide-react'
import { formatBytes, formatDate } from '@/lib/utils'
import { getBookmarks, removeBookmark as removeBookmarkStorage, getDownloads, addDownload, removeDownload as removeDownloadStorage } from '@/lib/bookmarks'
import toast from 'react-hot-toast'

const TYPE_LABELS: Record<string, string> = {
  lecture_notes: 'Lecture Notes',
  pyq: 'PYQ',
  assignment: 'Assignment',
  lab_manual: 'Lab Manual',
  reference_material: 'Reference',
}

const TYPE_COLORS: Record<string, string> = {
  lecture_notes: 'bg-indigo-50 text-indigo-700',
  pyq: 'bg-amber-50 text-amber-700',
  lab_manual: 'bg-teal-50 text-teal-700',
  assignment: 'bg-violet-50 text-violet-700',
  reference_material: 'bg-slate-100 text-slate-600',
}

import { incrementResourceDownload, useResources } from '@/lib/dataStore'
import type { Resource } from '@/types'

export default function BookmarksDownloads() {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'all' | 'pyqs' | 'downloads'>('bookmarks')
  const [bookmarks, setBookmarks] = useState<string[]>(() => getBookmarks())
  const [downloads, setDownloads] = useState<string[]>(() => getDownloads())
  const { resources: allResources } = useResources()

  useEffect(() => {
    function handleBookmarksChange() {
      setBookmarks(getBookmarks())
    }
    function handleDownloadsChange() {
      setDownloads(getDownloads())
    }
    window.addEventListener('syncnote:bookmarks_changed', handleBookmarksChange)
    window.addEventListener('syncnote:downloads_changed', handleDownloadsChange)

    return () => {
      window.removeEventListener('syncnote:bookmarks_changed', handleBookmarksChange)
      window.removeEventListener('syncnote:downloads_changed', handleDownloadsChange)
    }
  }, [])

  // Only keep resources that are actually bookmarked or downloaded
  const bookmarkedResources = allResources.filter(r => bookmarks.includes(r.id))
  const downloadedResources = allResources.filter(r => downloads.includes(r.id))

  const displayResources =
    activeTab === 'bookmarks'
      ? bookmarkedResources
      : activeTab === 'downloads'
      ? downloadedResources
      : activeTab === 'pyqs'
      ? bookmarkedResources.filter(r => r.resource_type === 'pyq')
      : [...new Map([...bookmarkedResources, ...downloadedResources].map(r => [r.id, r])).values()]

  function handleRemoveBookmark(id: string, title: string) {
    removeBookmarkStorage(id)
    setBookmarks(prev => prev.filter(b => b !== id))
    toast.success(`Removed "${title}" from bookmarks`)
  }

  function handleRemoveDownload(id: string, title: string) {
    removeDownloadStorage(id)
    setDownloads(prev => prev.filter(d => d !== id))
    toast.success(`Removed "${title}" from downloads`)
  }

  function handleDownload(resource: Resource) {
    addDownload(resource.id)
    incrementResourceDownload(resource.id)
    setDownloads(getDownloads())
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

  async function exportPDF() {
    if (displayResources.length === 0) {
      toast.error('No bookmarked resources to export.')
      return
    }

    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('SyncNote – Bookmarked Resources', 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28)
    doc.line(14, 32, 196, 32)

    let y = 40
    displayResources.forEach((r, i) => {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`${i + 1}. ${r.title}`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(
        `   Subject: ${r.subject?.name || 'General'}  |  Type: ${TYPE_LABELS[r.resource_type] || r.resource_type}  |  Sem: ${r.semester}`,
        14,
        y + 6
      )
      doc.setTextColor(0)
      y += 16
    })

    doc.save('syncnote-bookmarked-resources.pdf')
    toast.success('PDF list exported successfully!')
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <span className="text-slate-500">Student Workspace</span>
          <span>/</span>
          <span className="text-slate-700 font-medium">My Bookmarks</span>
        </nav>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Bookmarked Resources
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Your saved notes and study materials, organized for quick revision.
            </p>
          </div>
          {displayResources.length > 0 && (
            <button
              onClick={exportPDF}
              className="btn btn-secondary flex items-center gap-2 text-xs font-semibold"
            >
              <Download size={15} /> Export Saved List (PDF)
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Bookmark size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bookmarked</p>
            <p className="font-bold text-slate-800 text-xl">{bookmarkedResources.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
            <Download size={18} className="text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Downloads</p>
            <p className="font-bold text-slate-800 text-xl">{downloadedResources.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <HardDrive size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Saved PYQs</p>
            <p className="font-bold text-slate-800 text-xl">
              {bookmarkedResources.filter(r => r.resource_type === 'pyq').length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'bookmarks', label: `Bookmarked (${bookmarkedResources.length})` },
          { key: 'pyqs', label: `Saved PYQs (${bookmarkedResources.filter(r => r.resource_type === 'pyq').length})` },
          { key: 'downloads', label: `Downloads (${downloadedResources.length})` },
          { key: 'all', label: 'All Saved' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Resource List */}
      {displayResources.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 max-w-md mx-auto my-6 border border-dashed border-slate-200">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bookmark size={26} />
          </div>
          <h3 className="font-bold text-slate-700 text-base">No Bookmarked Files</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            You don't have any bookmarked files in this section yet. Browse semester notes or question papers and click the bookmark icon to save materials here.
          </p>
          <div className="flex gap-2 justify-center mt-5">
            <Link to="/semester-notes" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <BookOpen size={14} /> Browse Semester Notes
            </Link>
            <Link to="/pyqs" className="btn btn-secondary btn-sm">
              Past Exam Papers
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayResources.map(r => {
            const isItemBookmarked = bookmarks.includes(r.id)
            return (
              <div
                key={r.id}
                className="card p-4 flex items-start gap-4 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                      {r.title}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`badge ${TYPE_COLORS[r.resource_type] || 'bg-slate-100 text-slate-700'}`}>
                        {TYPE_LABELS[r.resource_type] || r.resource_type}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.subject?.name || 'Curriculum Subject'} · Sem {r.semester} · {r.branch}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                    <span>{formatBytes(r.file_size ?? 0)}</span>
                    <span>·</span>
                    <span>Added {formatDate(r.created_at)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 ml-2 flex-shrink-0">
                  <Link
                    to={`/resource/${r.id}`}
                    className="btn btn-sm btn-outline py-1 px-3 text-xs flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Preview
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDownload(r)}
                    className="btn btn-sm btn-secondary py-1 px-3 text-xs flex items-center gap-1"
                  >
                    <Download size={12} /> Download
                  </button>

                  {isItemBookmarked ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(r.id, r.title)}
                      className="btn btn-sm py-1 px-3 text-xs text-red-500 hover:bg-red-50 border border-red-100 rounded-lg flex items-center gap-1 transition-colors"
                      title="Remove from bookmarks"
                    >
                      <BookmarkX size={12} /> Remove
                    </button>
                  ) : downloads.includes(r.id) ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveDownload(r.id, r.title)}
                      className="btn btn-sm py-1 px-3 text-xs text-red-500 hover:bg-red-50 border border-red-100 rounded-lg flex items-center gap-1 transition-colors"
                      title="Remove from downloads"
                    >
                      <BookmarkX size={12} /> Remove
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
