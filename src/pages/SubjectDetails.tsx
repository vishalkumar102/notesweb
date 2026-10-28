import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, FileText, Download, Bookmark, Upload, ArrowRight, BookMarked } from 'lucide-react'
import { formatBytes, timeAgo } from '@/lib/utils'
import { getBookmarks, toggleBookmark as toggleBookmarkStorage } from '@/lib/bookmarks'
import toast from 'react-hot-toast'

const TYPE_LABELS: Record<string, string> = {
  lecture_notes: 'Lecture Notes', pyq: 'PYQ', assignment: 'Assignment',
  lab_manual: 'Lab Manual', reference_material: 'Reference',
}
const TYPE_COLORS: Record<string, string> = {
  lecture_notes: 'bg-indigo-50 text-indigo-700',
  pyq: 'bg-amber-50 text-amber-700',
  lab_manual: 'bg-teal-50 text-teal-700',
  assignment: 'bg-violet-50 text-violet-700',
  reference_material: 'bg-slate-100 text-slate-600',
}

import { getAllSubjects, useResources } from '@/lib/dataStore'
import type { Resource } from '@/types'

export default function SubjectDetails() {
  const { subjectId } = useParams()
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => getBookmarks())
  const { resources: allResources } = useResources()

  const allSubjects = getAllSubjects(allResources)
  const subject =
    allSubjects.find(s => s.id === subjectId) ||
    allResources.find(r => r.subject_id === subjectId || r.subject?.id === subjectId)?.subject || {
      id: subjectId || 'general',
      name: 'Subject Overview',
      branch: 'B.Tech CSE/IT',
      semester: 1,
      created_at: '',
    }

  useEffect(() => {
    function handleBookmarks() {
      setBookmarkedIds(getBookmarks())
    }
    window.addEventListener('syncnote:bookmarks_changed', handleBookmarks)
    return () => {
      window.removeEventListener('syncnote:bookmarks_changed', handleBookmarks)
    }
  }, [])

  const notes = allResources.filter(r => r.subject_id === subject.id && r.resource_type === 'lecture_notes')
  const others = allResources.filter(r => r.subject_id === subject.id && r.resource_type !== 'lecture_notes' && r.resource_type !== 'pyq')

  function handleToggleBookmark(resourceId: string, title: string) {
    const isNowBookmarked = toggleBookmarkStorage(resourceId)
    setBookmarkedIds(getBookmarks())
    toast.success(isNowBookmarked ? `Bookmarked "${title}"` : `Removed "${title}" from bookmarks`)
  }

  function ResourceRow({ r }: { r: Resource }) {
    const isBookmarked = bookmarkedIds.includes(r.id)

    return (
      <div className="flex items-start gap-3 p-3.5 hover:bg-slate-50 rounded-lg transition-colors group border border-transparent hover:border-slate-200">
        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText size={16} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">{r.title}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
            <span className={`badge ${TYPE_COLORS[r.resource_type]}`}>{TYPE_LABELS[r.resource_type]}</span>
            <span>{formatBytes(r.file_size ?? 0)}</span>
            <span>{timeAgo(r.created_at)}</span>
            <span className="flex items-center gap-0.5"><Download size={11} />{r.download_count}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <Link to={`/resource/${r.id}`} className="btn btn-sm btn-outline py-1 px-3 text-xs">Preview</Link>
          <button
            type="button"
            onClick={() => handleToggleBookmark(r.id, r.title)}
            className={`btn btn-sm py-1 px-2.5 transition-colors ${
              isBookmarked
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300'
                : 'btn-secondary text-slate-500'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this note'}
          >
            <Bookmark size={13} className={isBookmarked ? 'fill-indigo-600' : ''} />
          </button>
        </div>
      </div>
    )
  }

  function Section({ title, resources }: { title: string; resources: Resource[] }) {
    if (resources.length === 0) return null
    return (
      <div className="card p-4">
        <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
          <BookMarked size={15} className="text-indigo-500" /> {title}
          <span className="ml-auto text-xs text-slate-400 font-normal">{resources.length} files</span>
        </h3>
        <div className="divide-y divide-slate-100">
          {resources.map(r => <ResourceRow key={r.id} r={r} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 flex items-center gap-1">
        <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link to="/semester-notes" className="hover:text-indigo-600">Semester Notes</Link>
        <span>/</span>
        <span className="text-slate-600">{subject.name}</span>
      </nav>

      {/* Subject Header */}
      <div className="card p-6 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <BookOpen size={26} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-800">{subject.name}</h1>
              {subject.subject_code && (
                <span className="badge bg-indigo-100 text-indigo-700">{subject.subject_code}</span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{subject.branch} · Semester {subject.semester}</p>
            {subject.description && <p className="text-sm text-slate-500 mt-2">{subject.description}</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/upload" className="btn btn-primary btn-sm">
            <Upload size={14} /> Upload Note
          </Link>
          <button className="btn btn-secondary btn-sm">
            <BookMarked size={14} /> View Syllabus
          </button>
          <Link to={`/semester/${subject.semester}`} className="btn btn-secondary btn-sm">
            <ArrowRight size={14} /> Browse Semester {subject.semester}
          </Link>
        </div>
      </div>

      {/* Content */}
      {notes.length === 0 && others.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-slate-500">No lecture notes yet</p>
          <p className="text-sm mt-1">Be the first to upload notes for this subject!</p>
          <Link to="/upload" className="btn btn-primary mt-4">Upload Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <Section title="Lecture Notes & Study Materials" resources={notes} />
          <Section title="Other Resources & Lab Manuals" resources={others} />
        </div>
      )}
    </div>
  )
}
