import { Link, useParams } from 'react-router-dom'
import { BookOpen, ArrowRight, FileText, Upload } from 'lucide-react'
import { getAllSubjects, useResources } from '@/lib/dataStore'

const SEM_COLORS: Record<number, { from: string; icon: string }> = {
  1: { from: 'from-indigo-500 to-indigo-600', icon: 'text-indigo-600' },
  2: { from: 'from-violet-500 to-violet-600', icon: 'text-violet-600' },
  3: { from: 'from-teal-500 to-teal-600', icon: 'text-teal-600' },
  4: { from: 'from-blue-500 to-blue-600', icon: 'text-blue-600' },
  5: { from: 'from-purple-500 to-purple-600', icon: 'text-purple-600' },
  6: { from: 'from-cyan-500 to-cyan-600', icon: 'text-cyan-600' },
  7: { from: 'from-pink-500 to-pink-600', icon: 'text-pink-600' },
  8: { from: 'from-orange-500 to-orange-600', icon: 'text-orange-600' },
}

export default function SemesterDetail() {
  const { semesterId } = useParams()
  const sem = Number(semesterId) || 1
  const { resources: allResources } = useResources()

  const subjects = getAllSubjects(allResources).filter(s => s.semester === sem)
  const resources = allResources.filter(r => r.semester === sem)
  const col = SEM_COLORS[sem] || SEM_COLORS[1]

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 flex items-center gap-1">
        <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link to="/semester-notes" className="hover:text-indigo-600">Semester Notes</Link>
        <span>/</span>
        <span className="text-slate-700">Semester {sem}</span>
      </nav>

      {/* Header */}
      <div className={`rounded-2xl bg-gradient-to-r ${col.from} p-6 text-white shadow-lg`}>
        <h1 className="text-3xl font-bold mb-1">Semester {sem}</h1>
        <p className="text-white/80 text-sm">{subjects.length} subjects · {resources.length} resources</p>
      </div>

      {/* Subjects */}
      {subjects.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Subjects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.map(s => {
              const count = resources.filter(r => r.subject_id === s.id).length
              return (
                <Link key={s.id} to={`/subject/${s.id}`} className="card p-4 flex items-center gap-3 hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={18} className={`${col.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{s.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.subject_code} · {count} resources</p>
                  </div>
                  <ArrowRight size={15} className="ml-auto text-slate-300 group-hover:text-indigo-400 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center text-slate-400 space-y-3">
          <BookOpen size={44} className="mx-auto opacity-30 text-slate-400" />
          <p className="font-semibold text-slate-600 text-base">No subjects added yet for Semester {sem}</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload lecture notes, PYQs, or syllabus materials for Semester {sem} to create subjects.
          </p>
          <div className="pt-2">
            <Link to="/upload" className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm">
              <Upload size={14} /> Upload Notes for Semester {sem}
            </Link>
          </div>
        </div>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">All Resources</h2>
          <div className="space-y-2">
            {resources.map(r => (
              <Link key={r.id} to={`/resource/${r.id}`} className="card p-3.5 flex items-center gap-3 hover:border-indigo-200 hover:shadow-sm transition-all group">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 truncate">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.subject?.name}</p>
                </div>
                <ArrowRight size={13} className="ml-auto text-slate-300 group-hover:text-indigo-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
