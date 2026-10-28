import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Download, Bookmark, Search, Upload } from 'lucide-react'
import { formatBytes, timeAgo } from '@/lib/utils'
import { SEMESTERS } from '@/data/mockData'
import { getBookmarks, toggleBookmark as toggleBookmarkStorage } from '@/lib/bookmarks'
import { useResources } from '@/lib/dataStore'
import toast from 'react-hot-toast'

const YEARS = ['2024-25', '2023-24', '2022-23', '2021-22']

export default function PYQs() {
  const [activeSem, setActiveSem] = useState<number | 'all'>('all')
  const [activeYear, setActiveYear] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => getBookmarks())
  const { resources: allResources } = useResources()

  useEffect(() => {
    function handleBookmarks() {
      setBookmarkedIds(getBookmarks())
    }
    window.addEventListener('syncnote:bookmarks_changed', handleBookmarks)
    return () => {
      window.removeEventListener('syncnote:bookmarks_changed', handleBookmarks)
    }
  }, [])

  function handleToggleBookmark(resourceId: string, title: string) {
    const isNowBookmarked = toggleBookmarkStorage(resourceId)
    setBookmarkedIds(getBookmarks())
    toast.success(isNowBookmarked ? `Bookmarked "${title}"` : `Removed "${title}" from bookmarks`)
  }

  const pyqs = allResources.filter(r => {
    if (r.resource_type !== 'pyq') return false
    if (activeSem !== 'all' && r.semester !== activeSem) return false
    if (activeYear !== 'all' && r.academic_year !== activeYear) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.subject?.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in space-y-5">
      {/* Header with Title and Upload PYQ Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">Past Exam Papers (PYQs)</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Previous Year Question Papers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and download end-semester question papers, mid-terms, and solved answer keys.
          </p>
        </div>

        <Link
          to="/upload?type=pyq"
          className="btn bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow flex items-center gap-2 text-xs sm:text-sm self-start sm:self-auto transition-all"
        >
          <Upload size={16} />
          <span>Upload PYQ</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PYQs by subject or title…"
            className="form-input pl-9 py-2"
          />
        </div>
        <select
          value={activeYear}
          onChange={e => setActiveYear(e.target.value)}
          className="form-select max-w-[160px]"
        >
          <option value="all">All Academic Years</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Semester Pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveSem('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeSem === 'all' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'}`}>All</button>
        {SEMESTERS.map(s => (
          <button key={s} onClick={() => setActiveSem(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeSem === s ? 'bg-amber-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'}`}>Sem {s}</button>
        ))}
      </div>

      {/* Results */}
      {pyqs.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-500">No PYQs found</p>
          <Link to="/upload" className="btn btn-primary mt-4">Upload a PYQ</Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{pyqs.length} papers found</p>
          {pyqs.map(r => (
            <div key={r.id} className="card p-4 flex items-start gap-4 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm group-hover:text-amber-700 transition-colors">{r.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{r.subject?.name} · Sem {r.semester}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>{r.academic_year && `AY ${r.academic_year}`}</span>
                  <span>{formatBytes(r.file_size ?? 0)}</span>
                  <span>{timeAgo(r.created_at)}</span>
                  <span className="flex items-center gap-0.5"><Download size={11} />{r.download_count}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 ml-2 flex-shrink-0">
                <Link to={`/resource/${r.id}`} className="btn btn-sm btn-outline py-1 px-3 text-xs">Preview</Link>
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(r.id, r.title)}
                  className={`btn btn-sm py-1 px-2.5 transition-colors ${
                    bookmarkedIds.includes(r.id)
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                      : 'btn-secondary text-slate-500'
                  }`}
                  title={bookmarkedIds.includes(r.id) ? 'Remove bookmark' : 'Bookmark this PYQ'}
                >
                  <Bookmark size={13} className={bookmarkedIds.includes(r.id) ? 'fill-amber-600' : ''} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
