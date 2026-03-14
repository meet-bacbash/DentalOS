'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type DashboardRole = 'dso_admin' | 'practice_manager' | 'provider'

type AuthContextValue = {
  user: User | null
  loading: boolean
  role: DashboardRole
  displayName: string
  email: string
  clinicId: string | null
  providerName: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUser(data.user ?? null)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const appMetaRole = user?.app_metadata?.role
    const userMetaRole = user?.user_metadata?.role
    const rawRole = String(appMetaRole ?? userMetaRole ?? 'practice_manager')

    let role: DashboardRole = 'practice_manager'
    if (rawRole === 'admin' || rawRole === 'dso_admin') role = 'dso_admin'
    if (rawRole === 'provider') role = 'provider'
    if (rawRole === 'front_desk' || rawRole === 'practice_manager') role = 'practice_manager'

    const displayName = String(user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Operator')
    const clinicId = String(user?.user_metadata?.clinic_id ?? (role === 'dso_admin' ? '' : 'downtown')) || null

    const providerNameFromMeta = user?.user_metadata?.provider_name
    const providerName =
      role === 'provider'
        ? String(
            providerNameFromMeta ??
              (user?.email?.startsWith('sarah') ? 'Dr. Sarah Chen' : user?.email?.startsWith('marcus') ? 'Dr. Marcus Webb' : 'Dr. Priya Patel'),
          )
        : null

    return {
      user,
      loading,
      role,
      displayName,
      email: user?.email ?? 'ops@dentalos.dev',
      clinicId,
      providerName,
      signOut: () => supabase.auth.signOut(),
    }
  }, [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider')
  }
  return ctx
}
