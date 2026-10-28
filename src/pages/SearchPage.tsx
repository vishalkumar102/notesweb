import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, FileText, BookOpen, ArrowRight } from 'lucide-react'
import { getAllSubjects, useResources } from '@/lib/dataStore'
import { formatBytes, timeAgo } from '@/lib/utils'

export default function SearchPage() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const { resources: allResources } = useResources()

  const q = query.toLowerCase()

  const resourceResults = allResources.filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.subject?.name.toLowerCase().includes(q) ||
    r.uploader?.full_name.toLowerCase().includes(q)
  )
  const subjectResults = getAllSubjects(allResources).filter(s =>
    s.name.toLowerCase().includes(q) || s.subject_code?.toLowerCase().includes(q)
  )

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Search</h1>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          placeholder="Search notes, subjects, PYQs, contributors…"
          className="form-input pl-12 py-3 text-base"
        />
      </div>

      {!q ? (
        <div className="card p-16 text-center text-slate-400">
          <Search size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-500">Start typing to search</p>
          <p className="text-sm mt-1">Search for notes, PYQs, subjects, or contributors</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Subjects */}
          {subjectResults.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-500" /> Subjects ({subjectResults.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subjectResults.map(s => (
                  <Link key={s.id} to={`/subject/${s.id}`} className="card p-3 flex items-center gap-3 hover:border-indigo-200 hover:shadow-sm transition-all group">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen size={15} className="text-indigo-600" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.subject_code} · Sem {s.semester}</p>
                    </div>
                    <ArrowRight size={13} className="ml-auto text-slate-300 group-hover:text-indigo-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {resourceResults.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" /> Resources ({resourceResults.length})
              </h2>
              <div className="space-y-2">
                {resourceResults.map(r => (
                  <Link key={r.id} to={`/resource/${r.id}`} className="card p-3.5 flex items-start gap-3 hover:border-indigo-200 hover:shadow-sm transition-all group">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={15} className="text-indigo-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{r.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.subject?.name} · Sem {r.semester} · {formatBytes(r.file_size ?? 0)} · {timeAgo(r.created_at)}</p>
                    </div>
                    <ArrowRight size={13} className="mt-1 ml-auto text-slate-300 group-hover:text-indigo-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {resourceResults.length === 0 && subjectResults.length === 0 && (
            <div className="card p-16 text-center text-slate-400">
              <Search size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-500">No results for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords or browse by semester</p>
              <Link to="/semester-notes" className="btn btn-primary mt-4">Browse Notes</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
