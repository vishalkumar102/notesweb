import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, FileText, Bookmark,
  Upload, User, LogOut, Menu, X, ChevronRight,
  GraduationCap, Search,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Semester Notes', href: '/semester-notes', icon: BookOpen },
  { label: 'Past Exam Papers', href: '/pyqs', icon: FileText },
  { label: 'Bookmarks & Downloads', href: '/bookmarks-downloads', icon: Bookmark },
  { label: 'Upload Material', href: '/upload', icon: Upload },
]

const BOTTOM_ITEMS = [
  { label: 'Profile / Settings', href: '/profile', icon: User },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { pathname } = useLocation()
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
    onClose?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={18} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-slate-800 text-base leading-none">SyncNote</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Student Platform</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 rounded-md hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              to={href}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={17} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
        {BOTTOM_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link key={href} to={href} className={`nav-item ${pathname === href ? 'active' : ''}`} onClick={onClose}>
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
        <button className="nav-item text-red-500 hover:bg-red-50 hover:text-red-600 w-full" onClick={handleSignOut}>
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>

      {/* Profile mini */}
      {profile && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{profile.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{profile.course_branch}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 flex-shrink-0" style={{ boxShadow: '4px 0 12px 0 rgb(0 0 0 / 0.04)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-left">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, subjects, PYQs…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            <Link to="/profile" className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {profile ? getInitials(profile.full_name) : 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                {profile?.full_name.split(' ')[0] || 'Student'}
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
