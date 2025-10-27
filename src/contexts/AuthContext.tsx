import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

// User profile type from our database
type UserProfile = Database['public']['Tables']['users']['Row']

// Session type from Supabase
type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']

interface AuthContextType {
  // Auth state
  user: User | null
  profile: UserProfile | null
  session: Session
  loading: boolean

  // Auth methods
  signUp: (email: string, password: string, displayName: string, role: 'facilitator' | 'participant') => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithToken: (token: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from our users table
  const fetchProfile = async (userId: string) => {
    console.log('🔍 fetchProfile: Starting for userId:', userId)

    try {
      // Add 5-second timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 5000)
      })

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      console.log('🔍 fetchProfile: Query created, waiting...')

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      console.log('🔍 fetchProfile: Query returned', { hasData: !!data, error: error?.message })

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      // If profile doesn't exist, create it from auth metadata
      if (!data) {
        console.log('Profile not found, creating from auth metadata...')
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.user_metadata) {
          // Use upsert to avoid duplicate key errors
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .upsert({
              id: userId,
              email: user.email!,
              display_name: user.user_metadata.display_name || user.email?.split('@')[0] || 'User',
              role: user.user_metadata.role || 'participant',
              status: 'registered',
            }, {
              onConflict: 'id'
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            return null
          }

          return newProfile
        }
      }

      return data
    } catch (err: any) {
      console.error('❌ fetchProfile exception:', err.message)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile)
      }

      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('🔐 Fetching profile for:', session.user.id)
        try {
          const profile = await fetchProfile(session.user.id)
          console.log('🔐 Profile fetched:', profile?.role)
          setProfile(profile)
        } catch (err) {
          console.error('❌ Error in fetchProfile:', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign up with email/password
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'facilitator' | 'participant'
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          display_name: displayName,
          role: role,
        }
      }
    })

    if (error) return { error }
    if (!data.user) return { error: new AuthError('User creation failed') as AuthError }

    // Create user profile in our users table
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      display_name: displayName,
      role,
      status: 'registered',
    })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Note: User is created in auth.users but profile failed
      // They can still log in but may need profile creation retry
    }

    return { error: null }
  }

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email)

    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Authentication timeout after 10 seconds'))
        }, 10000)
      })

      console.log('🔐 Calling supabase.auth.signInWithPassword...')

      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })

      const { error, data } = await Promise.race([authPromise, timeoutPromise]) as any

      console.log('🔐 Sign in response:', { error: error?.message, hasSession: !!data?.session })

      if (!error && data?.session) {
        console.log('✅ Sign in successful, skipping last_login_at update to avoid RLS issues')
        // Skip last_login_at update for now - it might be causing issues
      }

      return { error }
    } catch (err) {
      console.error('❌ Sign in exception:', err)
      return { error: err as AuthError }
    }
  }

  // Sign in with access token (QR code flow)
  const signInWithToken = async (token: string) => {
    try {
      // Validate token and get user_id
      const { data: tokenData, error: tokenError } = await supabase
        .from('access_tokens')
        .select('user_id, expires_at, used_at, is_valid')
        .eq('token', token)
        .single()

      if (tokenError || !tokenData) {
        return { error: new Error('Invalid access token') }
      }

      // Check if token is valid
      if (!tokenData.is_valid) {
        return { error: new Error('Token has been revoked') }
      }

      if (tokenData.used_at) {
        return { error: new Error('Token has already been used') }
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return { error: new Error('Token has expired') }
      }

      // Mark token as used
      await supabase
        .from('access_tokens')
        .update({
          used_at: new Date().toISOString(),
          used_from_ip: 'web-client', // In production, get actual IP
        })
        .eq('token', token)

      // Get user email to sign in
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', tokenData.user_id)
        .single()

      if (userError || !userData) {
        return { error: new Error('User not found') }
      }

      // For QR code login, we need to use Supabase's magic link or create a session
      // Since we can't directly create a session, we'll use a temporary password approach
      // In production, you might want to use Supabase's admin API to create a session

      // For now, return success and set the user manually
      // This is a simplified version - in production, use proper session creation
      return { error: new Error('QR code login requires server-side session creation') }

    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Unknown error') }
    }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  // Refresh profile (useful after updates)
  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchProfile(user.id)
      setProfile(profile)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithToken,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
