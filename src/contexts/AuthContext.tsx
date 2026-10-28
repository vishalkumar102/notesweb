import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isOfflineMode: boolean
  signUp: (email: string, password: string, data: Partial<Profile>) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
  loginAsDemo: () => Promise<void>
}

interface LocalStoredAccount {
  email: string
  passwordHash: string
  profile: Profile
}

const LOCAL_USERS_KEY = 'syncnote_local_users'
const LOCAL_SESSION_KEY = 'syncnote_current_session'

const DEFAULT_DEMO_USERS: LocalStoredAccount[] = [
  {
    email: 'alex.21cs@university.edu',
    passwordHash: 'password123',
    profile: {
      id: 'usr_alex_demo_01',
      full_name: 'Alex Sharma',
      enrollment_no: '21BCE10482',
      course_branch: 'B.Tech CSE',
      current_semester: 4,
      avatar_url: '',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
  },
  {
    email: 'priya.sharma@university.edu',
    passwordHash: 'password123',
    profile: {
      id: 'usr_priya_demo_02',
      full_name: 'Priya Sharma',
      enrollment_no: '2200001',
      course_branch: 'B.Tech CSE',
      current_semester: 1,
      avatar_url: '',
      created_at: '2024-07-01T00:00:00Z',
      updated_at: '2024-07-01T00:00:00Z',
    },
  },
]

function getLocalUsers(): LocalStoredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_DEMO_USERS))
      return DEFAULT_DEMO_USERS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_DEMO_USERS
  }
}

function saveLocalUsers(users: LocalStoredAccount[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Failed to save local users', err)
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured)

  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      // 1. If Supabase is configured with real URL/key, attempt real session
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!isMounted) return
          if (session) {
            setSession(session)
            setUser(session.user)
            await fetchProfile(session.user.id)
            setLoading(false)
            return
          }
        } catch (e) {
          console.warn('Supabase session lookup failed, falling back to local storage', e)
          setIsOfflineMode(true)
        }
      }

      // 2. Check local fallback session
      try {
        const cached = localStorage.getItem(LOCAL_SESSION_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed?.profile && parsed?.user) {
            setUser(parsed.user as User)
            setSession(parsed.session as Session)
            setProfile(parsed.profile as Profile)
          }
        }
      } catch (err) {
        console.error('Error restoring local session', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    // Subscribe to Supabase auth events if configured
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      })
      return () => {
        isMounted = false
        subscription.unsubscribe()
      }
    }

    return () => {
      isMounted = false
    }
  }, [])

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        setProfile(data as Profile)
        return
      }
    } catch {
      // Supabase fetch failed
    }

    // Try finding in local users
    const localUsers = getLocalUsers()
    const found = localUsers.find(u => u.profile.id === userId)
    if (found) {
      setProfile(found.profile)
    }
  }

  function setLocalAuthSession(userAccount: LocalStoredAccount) {
    const mockUser = {
      id: userAccount.profile.id,
      email: userAccount.email,
      aud: 'authenticated',
      role: 'authenticated',
      created_at: userAccount.profile.created_at,
      user_metadata: {
        full_name: userAccount.profile.full_name,
        enrollment_no: userAccount.profile.enrollment_no,
      },
    } as unknown as User

    const mockSession = {
      access_token: 'local_token_' + userAccount.profile.id,
      refresh_token: 'local_refresh_' + userAccount.profile.id,
      expires_in: 86400,
      token_type: 'bearer',
      user: mockUser,
    } as unknown as Session

    setUser(mockUser)
    setSession(mockSession)
    setProfile(userAccount.profile)
    setIsOfflineMode(true)

    try {
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({
          user: mockUser,
          session: mockSession,
          profile: userAccount.profile,
        })
      )
    } catch (err) {
      console.error('Error persisting local session', err)
    }
  }

  async function signUp(email: string, password: string, profileData: Partial<Profile>): Promise<{ error: Error | null }> {
    // 1. Try Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            full_name: profileData.full_name || 'Student',
            enrollment_no: profileData.enrollment_no || '',
            course_branch: profileData.course_branch || 'B.Tech CSE',
            current_semester: profileData.current_semester || 1,
            avatar_url: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          await supabase.from('profiles').insert(newProfile)
          setProfile(newProfile)
          return { error: null }
        }
      } catch (err: any) {
        console.warn('Supabase signup error, continuing with local registration fallback:', err)
        // If Supabase returned a valid user error like already registered, return it
        if (err.message && err.message.toLowerCase().includes('already registered')) {
          return { error: err }
        }
      }
    }

    // 2. Local registration fallback
    try {
      const users = getLocalUsers()
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (existing) {
        return { error: new Error('An account with this email already exists.') }
      }

      const newId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
      const newProfile: Profile = {
        id: newId,
        full_name: profileData.full_name || 'Student',
        enrollment_no: profileData.enrollment_no || '',
        course_branch: profileData.course_branch || 'B.Tech CSE',
        current_semester: profileData.current_semester || 1,
        avatar_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const newAccount: LocalStoredAccount = {
        email: email.trim().toLowerCase(),
        passwordHash: password,
        profile: newProfile,
      }

      users.push(newAccount)
      saveLocalUsers(users)
      setLocalAuthSession(newAccount)
      return { error: null }
    } catch (e: any) {
      return { error: e instanceof Error ? e : new Error(String(e)) }
    }
  }

  async function signIn(email: string, password: string): Promise<{ error: Error | null }> {
    const cleanEmail = email.trim().toLowerCase()

    // 1. Try Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (!error) return { error: null }
      } catch (e) {
        console.warn('Supabase sign in failed, checking local credentials', e)
      }
    }

    // 2. Local fallback sign in
    const users = getLocalUsers()
    const found = users.find(u => u.email.toLowerCase() === cleanEmail)
    if (found) {
      if (found.passwordHash === password) {
        setLocalAuthSession(found)
        return { error: null }
      }
      return { error: new Error('Invalid email or password.') }
    }

    // Check demo accounts tolerance
    if (cleanEmail === 'alex.21cs@university.edu' || cleanEmail === 'demo@syncnote.edu') {
      const demoAccount = DEFAULT_DEMO_USERS[0]
      setLocalAuthSession(demoAccount)
      return { error: null }
    }

    return { error: new Error('Account not found. Please create an account first.') }
  }

  async function loginAsDemo() {
    const users = getLocalUsers()
    const demo = users[0] || DEFAULT_DEMO_USERS[0]
    setLocalAuthSession(demo)
  }

  async function signOut() {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.warn('Supabase signOut error', e)
      }
    }
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY)
    } catch (e) {
      console.warn('Storage removal error', e)
    }
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  async function resetPassword(email: string): Promise<{ error: Error | null }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error: error ?? null }
      } catch (e) {
        return { error: e as Error }
      }
    }
    // Local fallback: simulate password reset success
    return { error: null }
  }

  async function updateProfile(data: Partial<Profile>): Promise<{ error: Error | null }> {
    if (!user) return { error: new Error('Not authenticated') }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (!error) {
          setProfile(prev => prev ? { ...prev, ...data } : prev)
          return { error: null }
        }
      } catch (e) {
        console.warn('Supabase profile update failed, updating locally', e)
      }
    }

    // Update in local state and storage
    setProfile(prev => {
      const updated = prev ? { ...prev, ...data, updated_at: new Date().toISOString() } : null
      if (updated) {
        const users = getLocalUsers()
        const idx = users.findIndex(u => u.profile.id === user.id)
        if (idx !== -1) {
          users[idx].profile = updated
          saveLocalUsers(users)
        }
        try {
          const cached = localStorage.getItem(LOCAL_SESSION_KEY)
          if (cached) {
            const parsed = JSON.parse(cached)
            parsed.profile = updated
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(parsed))
          }
        } catch {
          // ignore
        }
      }
      return updated
    })

    return { error: null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isOfflineMode,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
