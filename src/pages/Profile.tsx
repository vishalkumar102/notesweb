import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Hash, BookOpen, Camera, Lock, Shield, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { BRANCHES, SEMESTERS } from '@/data/mockData'
import { getInitials } from '@/lib/utils'
import { useLiveSyncNoteData } from '@/lib/dataStore'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  course_branch: z.string().min(1, 'Select branch'),
  current_semester: z.number().min(1).max(8),
})
type ProfileForm = z.infer<typeof profileSchema>

const pwSchema = z.object({
  current_password: z.string().min(6, 'Enter current password'),
  new_password: z.string().min(8, 'Min 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, { message: 'Passwords must match', path: ['confirm_password'] })
type PwForm = z.infer<typeof pwSchema>

export default function Profile() {
  const { profile, user, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'stats'>('profile')
  const [pwChanged, setPwChanged] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      course_branch: profile?.course_branch ?? '',
      current_semester: profile?.current_semester ?? 1,
    },
  })

  const { register: rPw, handleSubmit: hsPw, formState: { errors: ePw, isSubmitting: isPwSubmitting } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  async function onSaveProfile(data: ProfileForm) {
    const { error } = await updateProfile(data)
    if (error) toast.error('Failed to save profile.')
    else toast.success('Profile updated successfully!')
  }

  async function onChangePassword(_data: PwForm) {
    await new Promise(r => setTimeout(r, 800))
    setPwChanged(true)
    toast.success('Password changed! Please sign in again.')
  }

  const { credits, bookmarks, myUploadsCount, resources } = useLiveSyncNoteData(user?.id)
  const myDownloadsCount = resources
    .filter(resource => resource.uploader_id === user?.id)
    .reduce((sum, resource) => sum + (resource.download_count || 0), 0)

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in space-y-5">
      {/* Header */}
      <div>
        <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <span className="text-slate-700">Profile & Settings</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-800">Profile & Settings</h1>
      </div>

      {/* Profile Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-lg">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {profile ? getInitials(profile.full_name) : 'U'}
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-indigo-50 transition-colors">
              <Camera size={12} className="text-indigo-700" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name || user?.email}</h2>
            <p className="text-indigo-200 text-sm mt-0.5">{profile?.course_branch || 'B.Tech Student'}</p>
            <p className="text-indigo-200 text-xs mt-0.5">{user?.email}</p>
          </div>
          <div className="ml-auto text-center hidden sm:block">
            <p className="text-2xl font-bold">{credits.toLocaleString()}</p>
            <p className="text-xs text-indigo-200">SyncCredits</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'profile', label: 'Profile Info', icon: User },
          { key: 'security', label: 'Security', icon: Shield },
          { key: 'stats', label: 'My Stats', icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit(onSaveProfile)} className="card p-6 space-y-4">
          <div>
            <label className="form-label">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('full_name')} className={`form-input pl-9 ${errors.full_name ? 'error' : ''}`} />
            </div>
            {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={user?.email ?? ''} readOnly className="form-input pl-9 bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed here. Contact support if needed.</p>
          </div>

          <div>
            <label className="form-label">Enrollment Number</label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={profile?.enrollment_no ?? ''} readOnly className="form-input pl-9 bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Enrollment number cannot be changed after registration.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Branch / Course</label>
              <select {...register('course_branch')} className="form-select">
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Current Semester</label>
              <select {...register('current_semester', { valueAsNumber: true })} className="form-select">
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card p-6 space-y-4">
          {pwChanged ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <p className="font-semibold text-slate-800">Password Changed Successfully</p>
              <p className="text-sm text-slate-500">Sign in again with your new password.</p>
            </div>
          ) : (
            <form onSubmit={hsPw(onChangePassword)} className="space-y-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Lock size={15} className="text-indigo-500" /> Change Password</h3>
              {[
                { field: 'current_password' as const, label: 'Current Password', err: ePw.current_password },
                { field: 'new_password' as const, label: 'New Password', err: ePw.new_password },
                { field: 'confirm_password' as const, label: 'Confirm New Password', err: ePw.confirm_password },
              ].map(({ field, label, err }) => (
                <div key={field}>
                  <label className="form-label">{label}</label>
                  <input {...rPw(field)} type="password" className={`form-input ${err ? 'error' : ''}`} placeholder="••••••••" />
                  {err && <p className="form-error">{err.message}</p>}
                </div>
              ))}
              <button type="submit" disabled={isPwSubmitting} className="btn btn-primary">
                {isPwSubmitting ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Uploads', value: myUploadsCount, color: 'stat-indigo', icon: BookOpen },
            { label: 'SyncCredits', value: credits.toLocaleString(), color: 'stat-amber', icon: User },
            { label: 'Bookmarks', value: bookmarks.length, color: 'stat-teal', icon: BookOpen },
            { label: 'Downloads Earned', value: myDownloadsCount.toString(), color: 'stat-indigo', icon: BookOpen },
            { label: 'Approved', value: myUploadsCount, color: 'stat-teal', icon: CheckCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className={`rounded-xl p-4 text-white ${color}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-white/70" />
                <span className="text-white/70 text-xs">{label}</span>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
