'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const hasSession = Boolean(data.session)
      if (!hasSession && pathname !== '/login') {
        router.replace('/login')
        return
      }
      if (hasSession && pathname === '/login') {
        router.replace('/')
        return
      }
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = Boolean(session)
      if (!hasSession && pathname !== '/login') {
        router.replace('/login')
      }
      if (hasSession && pathname === '/login') {
        router.replace('/')
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [pathname, router])

  if (!ready) {
    return <div className="p-8 text-sm text-slate-500">Loading...</div>
  }

  return <>{children}</>
}
