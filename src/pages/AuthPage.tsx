import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, User, Hash, Lock, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { BRANCHES, SEMESTERS } from '@/data/mockData'
import toast from 'react-hot-toast'

// ─── Schemas ──────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  enrollment_no: z.string().min(3, 'Enter a valid enrollment number'),
  course_branch: z.string().min(1, 'Please select your branch'),
  current_semester: z.number().min(1, 'Select a semester').max(8),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
  agree_terms: z.boolean().refine(v => v === true, {
    message: 'You must agree to the terms & honesty code',
  }),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type LoginForm = z.infer<typeof loginSchema>
type SignupForm = z.infer<typeof signupSchema>

// ─── Forgot Password Modal ──────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) toast.error('Failed to send reset email. Check the address.')
    else setSent(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-fade-in border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Reset Password</h2>
        {!sent ? (
          <>
            <p className="text-sm text-slate-500 mb-6">Enter your student email and we'll send a password reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={onClose} className="btn btn-secondary w-full">Cancel</button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="text-green-600" size={32} />
            </div>
            <p className="text-slate-600">Password reset instructions sent to <strong>{email}</strong>.</p>
            <button onClick={onClose} className="btn btn-primary w-full">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { signIn, loginAsDemo } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginForm) {
    try {
      const { error } = await signIn(data.email, data.password)
      if (error) {
        toast.error(error.message || 'Sign in failed. Please check your credentials.')
      } else {
        toast.success('Welcome back to SyncNote!')
        navigate('/dashboard')
      }
    } catch {
      toast.error('Unable to sign in. Please try again.')
    }
  }

  async function handleDemoLogin() {
    await loginAsDemo()
    toast.success('Signed in as Alex Sharma (Demo Account)')
    navigate('/dashboard')
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          const first = Object.values(formErrors)[0]?.message
          if (first) toast.error(first as string)
        })}
        className="space-y-4"
      >
        <div>
          <label className="form-label">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              {...register('email')}
              type="email"
              className={`form-input pl-9 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="e.g. alex.21cs@university.edu"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="form-error text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="form-label mb-0">Password</label>
            <button type="button" onClick={onForgot} className="text-xs text-indigo-600 hover:underline font-medium">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className={`form-input pl-9 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="form-error text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full shadow-md py-2.5">
          {isSubmitting ? 'Signing in…' : 'Sign In →'}
        </button>
      </form>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase tracking-wider">or quick test</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
      >
        <Sparkles size={14} className="text-indigo-600" />
        One-Click Demo Student Sign In (Alex Sharma)
      </button>
    </div>
  )
}

// ─── Signup Form ──────────────────────────────────────────────────────────────
function SignupForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      enrollment_no: '',
      course_branch: 'B.Tech CSE',
      current_semester: 1,
      password: '',
      confirm_password: '',
      agree_terms: false,
    },
  })

  async function onSubmit(data: SignupForm) {
    try {
      const { error } = await signUp(data.email, data.password, {
        full_name: data.full_name,
        enrollment_no: data.enrollment_no,
        course_branch: data.course_branch,
        current_semester: Number(data.current_semester),
      })
      if (error) {
        if (error.message?.toLowerCase().includes('already')) {
          toast.error('An account with this email already exists.')
        } else {
          toast.error(error.message || 'Registration failed. Please try again.')
        }
      } else {
        toast.success('Account created successfully! Welcome to SyncNote.')
        navigate('/dashboard')
      }
    } catch {
      toast.error('Failed to create account. Please try again.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        const first = Object.values(formErrors)[0]?.message
        if (first) toast.error(first as string)
      })}
      className="space-y-3"
    >
      <div>
        <label className="form-label text-xs font-medium text-slate-700">Full Name</label>
        <div className="relative">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            {...register('full_name')}
            className={`form-input pl-9 text-sm py-2 ${errors.full_name ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="e.g. Alex Sharma"
          />
        </div>
        {errors.full_name && <p className="form-error text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
      </div>

      <div>
        <label className="form-label text-xs font-medium text-slate-700">Student Email Address</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            {...register('email')}
            type="email"
            className={`form-input pl-9 text-sm py-2 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="alex.21cs@university.edu"
          />
        </div>
        {errors.email && <p className="form-error text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="form-label text-xs font-medium text-slate-700">Enrollment / Roll Number</label>
        <div className="relative">
          <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            {...register('enrollment_no')}
            className={`form-input pl-9 text-sm py-2 ${errors.enrollment_no ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="e.g. 21BCE10482"
          />
        </div>
        {errors.enrollment_no && <p className="form-error text-xs text-red-500 mt-1">{errors.enrollment_no.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label text-xs font-medium text-slate-700">Branch / Major</label>
          <select
            {...register('course_branch')}
            className={`form-select text-xs py-2 ${errors.course_branch ? 'border-red-400' : ''}`}
          >
            {BRANCHES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {errors.course_branch && <p className="form-error text-xs text-red-500 mt-1">{errors.course_branch.message}</p>}
        </div>

        <div>
          <label className="form-label text-xs font-medium text-slate-700">Current Semester</label>
          <select
            {...register('current_semester', { valueAsNumber: true })}
            className={`form-select text-xs py-2 ${errors.current_semester ? 'border-red-400' : ''}`}
          >
            {SEMESTERS.map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
          {errors.current_semester && <p className="form-error text-xs text-red-500 mt-1">{errors.current_semester.message}</p>}
        </div>
      </div>

      <div>
        <label className="form-label text-xs font-medium text-slate-700">Password (min 8 chars)</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className={`form-input pl-9 pr-10 text-sm py-2 ${errors.password ? 'border-red-400' : ''}`}
            placeholder="Create password"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="form-error text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="form-label text-xs font-medium text-slate-700">Confirm Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            {...register('confirm_password')}
            type={showConfirmPassword ? 'text' : 'password'}
            className={`form-input pl-9 pr-10 text-sm py-2 ${errors.confirm_password ? 'border-red-400' : ''}`}
            placeholder="Confirm password"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirm_password && <p className="form-error text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>}
      </div>

      <label className="flex items-start gap-2 cursor-pointer pt-1">
        <input
          {...register('agree_terms')}
          type="checkbox"
          className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-xs text-slate-600 leading-tight">
          I agree to the SyncNote{' '}
          <span className="text-indigo-600 font-medium hover:underline">Terms of Service</span>{' '}
          and verified{' '}
          <span className="text-indigo-600 font-medium hover:underline">Academic Honesty Code</span>.
        </span>
      </label>
      {errors.agree_terms && <p className="form-error text-xs text-red-500 mt-0.5">{errors.agree_terms.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full shadow-lg py-2.5 mt-2 font-semibold"
      >
        {isSubmitting ? 'Creating account…' : 'Create Free Student Account →'}
      </button>
    </form>
  )
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState<'signup' | 'login'>('signup')
  const [showForgot, setShowForgot] = useState(false)

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background with Guru Ghasidas Vishwavidyalaya Campus Gate */}
      <div className="fixed inset-0 z-0 bg-slate-900 overflow-hidden">
        <img
          src="/campus-gate.png"
          alt="Guru Ghasidas Vishwavidyalaya Campus Gate"
          className="w-full h-full object-cover object-center transform scale-105 filter brightness-90 contrast-105"
        />
        {/* Modern multi-layer gradient backdrop overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/50 to-slate-950/80 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md my-6">
        {/* University & Brand Header */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40 border border-indigo-400/40">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              SyncNote
            </span>
          </div>
          <p className="text-xs text-white/85 mt-1 font-medium drop-shadow">
            Student Academic Resource &amp; Notes Sharing Platform
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-black/30 backdrop-blur-md border border-white/20 rounded-full p-1 mb-4 max-w-xs mx-auto shadow-xl">
          <button
            onClick={() => setTab('signup')}
            type="button"
            className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 ${tab === 'signup'
                ? 'bg-white text-slate-800 shadow-md scale-100'
                : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
          >
            Create Account
          </button>
          <button
            onClick={() => setTab('login')}
            type="button"
            className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 ${tab === 'login'
                ? 'bg-white text-slate-800 shadow-md scale-100'
                : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
          >
            Sign In
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-7 border border-white/60 animate-fade-in">
          {tab === 'signup' ? (
            <>
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-800">Join SyncNote Free</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Get instant access to semester-wise notes, lab manuals &amp; PYQs.
                </p>
              </div>
              <SignupForm />
              <p className="text-center text-xs text-slate-500 mt-4">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in to access your saved notes, subjects, and downloads.
                </p>
              </div>
              <LoginForm onForgot={() => setShowForgot(true)} />
              <p className="text-center text-xs text-slate-500 mt-4">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Create free account
                </button>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-5 space-y-2">
          <p className="text-white/90 text-xs flex items-center justify-center gap-1.5 drop-shadow">
            <ShieldCheck size={14} className="text-green-400" />
            Official Academic Resource Portal · Verified Student Access
          </p>
          <div className="flex items-center justify-center gap-3 text-white/70 text-xs drop-shadow">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="#" className="hover:text-white transition-colors">Community Guidelines</Link>
            <span>·</span>
            <Link to="#" className="hover:text-white transition-colors">Help Desk</Link>
          </div>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}
