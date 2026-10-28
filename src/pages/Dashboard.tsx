import { Link } from 'react-router-dom'
import { BookOpen, Download, Bookmark, Upload, ArrowRight, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatBytes, timeAgo } from '@/lib/utils'
import { toggleBookmark as toggleBookmarkStorage, addDownload } from '@/lib/bookmarks'
import { useLiveSyncNoteData, incrementResourceDownload, getAllSubjects } from '@/lib/dataStore'
import type { Resource } from '@/types'
import toast from 'react-hot-toast'

const SEMESTER_COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-indigo-500 to-indigo-600',
  'from-indigo-500 to-indigo-600',
  'from-indigo-500 to-indigo-600',
  'from-indigo-500 to-indigo-600',
  'from-indigo-500 to-indigo-600',
  'from-indigo-500 to-indigo-600',
  'from-indigo-500 to-indigo-600',
]

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  to,
  hint,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  to?: string
  hint?: string
}) {
  const cardContent = (
    <div className={`rounded-xl p-4 text-white ${color} shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer group`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-xs font-medium uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold">{value}</p>
        {hint && (
          <span className="text-[11px] text-white/75 group-hover:text-white flex items-center gap-0.5 transition-colors font-medium">
            {hint} <ArrowRight size={11} />
          </span>
        )}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

function ResourceCard({
  resource,
  isBookmarked,
  onToggleBookmark,
  onDownload,
}: {
  resource: Resource
  isBookmarked: boolean
  onToggleBookmark: (id: string, title: string) => void
  onDownload: (resource: Resource) => void
}) {
  const typeColors: Record<string, string> = {
    lecture_notes: 'bg-indigo-50 text-indigo-700',
    pyq: 'bg-amber-50 text-amber-700',
    lab_manual: 'bg-teal-50 text-teal-700',
    assignment: 'bg-violet-50 text-violet-700',
    reference_material: 'bg-slate-50 text-slate-700',
  }
  const typeLabels: Record<string, string> = {
    lecture_notes: 'Lecture Notes',
    pyq: 'PYQ',
    lab_manual: 'Lab Manual',
    assignment: 'Assignment',
    reference_material: 'Reference',
  }

  return (
    <div className="card p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
          <FileText size={18} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm leading-snug truncate group-hover:text-indigo-700 transition-colors">
            {resource.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{resource.subject?.name} · Sem {resource.semester}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`badge ${typeColors[resource.resource_type] ?? 'bg-slate-50 text-slate-700'}`}>
              {typeLabels[resource.resource_type]}
            </span>
            <span className="text-xs text-slate-400">{formatBytes(resource.file_size ?? 0)}</span>
            <span className="text-xs text-slate-400">{timeAgo(resource.created_at)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Download size={12} /> {resource.download_count}
        </span>
        <span className="text-xs text-slate-400">by {resource.uploader?.full_name}</span>
        <div className="ml-auto flex gap-1.5">
          <Link to={`/resource/${resource.id}`} className="btn btn-sm btn-outline py-1 px-3 text-xs">Preview</Link>
          <button
            type="button"
            onClick={() => onDownload(resource)}
            className="btn btn-sm btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
            title="Download note"
          >
            <Download size={12} />
          </button>
          <button
            type="button"
            onClick={() => onToggleBookmark(resource.id, resource.title)}
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
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'Student'
  const { resources, bookmarks, downloads, totalMaterials } = useLiveSyncNoteData()
  const recentResources = resources.slice(0, 4)

  function handleToggleBookmark(resourceId: string, title: string) {
    const isNowBookmarked = toggleBookmarkStorage(resourceId)
    toast.success(isNowBookmarked ? `Bookmarked "${title}"` : `Removed "${title}" from bookmarks`)
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-800 p-6 sm:p-7 text-white shadow-xl">
        {/* Subtle background overlay */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
          <img
            src="/engineering-building.png"
            alt="Campus Background"
            className="w-full h-full object-cover object-center filter blur-[1px]"
          />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
              Your central academic hub for B.Tech Computer Science &amp; Information Technology. Access syllabus notes, past question papers, and collaborate with your peers.
            </p>
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <Link to="/semester-notes" className="btn bg-white text-indigo-800 hover:bg-indigo-50 font-semibold shadow-md flex items-center gap-1.5 text-xs sm:text-sm py-2 px-4">
                Browse Semester Notes <ArrowRight size={15} />
              </Link>
              <Link to="/pyqs" className="btn bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm text-xs sm:text-sm py-2 px-4">
                Explore Past Papers
              </Link>
            </div>
          </div>

          {/* Institute of Technology Building Image Card */}
          <div className="relative flex-shrink-0 group">
            <div className="relative w-full sm:w-80 h-44 rounded-xl overflow-hidden border-2 border-white/25 shadow-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-white/40">
              <img
                src="/engineering-building.png"
                alt="प्रौद्योगिकी संस्थान · Institute of Technology"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-3">
                <span className="text-[12px] font-bold text-white tracking-wide drop-shadow">
                  प्रौद्योगिकी संस्थान · Institute of Technology
                </span>
                <span className="text-[10px] text-indigo-200 font-medium drop-shadow">
                  School of Studies in Engineering &amp; Technology (IT Building)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Fully Connected */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Study Materials"
          value={totalMaterials.toLocaleString()}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          to="/semester-notes"
          hint="Browse All"
        />
        <StatCard
          icon={Download}
          label="Downloads"
          value={downloads.length.toLocaleString()}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          to="/bookmarks-downloads"
          hint="My Files"
        />
        <StatCard
          icon={Bookmark}
          label="Bookmarked"
          value={bookmarks.length}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          to="/bookmarks-downloads"
          hint="My Saved"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/upload" className="card p-5 flex items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
              <Upload size={22} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Upload Study Material</h3>
              <p className="text-xs text-slate-500 mt-0.5">Share & earn +150 SyncCredits</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Browse by Semester */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Browse by Semester</h2>
          <Link to="/semester-notes" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight size={13} /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
            const subjectCount = getAllSubjects(resources).filter(s => s.semester === sem).length
            return (
              <Link
                key={sem}
                to={`/semester/${sem}`}
                className={`rounded-xl bg-gradient-to-br ${SEMESTER_COLORS[sem - 1]} p-4 text-white text-center hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer`}
              >
                <p className="text-xl font-bold">{sem}</p>
                <p className="text-xs text-white/80 mt-0.5 font-medium">Semester</p>
                {subjectCount > 0 && (
                  <p className="text-[11px] text-white/70 mt-1">{subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'}</p>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Resources */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Recent Resources</h2>
          <Link to="/semester-notes" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight size={13} /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentResources.map(r => (
            <ResourceCard
              key={r.id}
              resource={r}
              isBookmarked={bookmarks.includes(r.id)}
              onToggleBookmark={handleToggleBookmark}
              onDownload={handleDownload}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
