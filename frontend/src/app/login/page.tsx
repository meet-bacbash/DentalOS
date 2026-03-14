'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '../../components/AuthGuard'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@dentalos.dev')
  const [password, setPassword] = useState('password123')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        return
      }
      router.replace('/')
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'patient' } },
    })
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    setMessage('Signup successful. Check your email if confirmation is enabled, then sign in.')
    setMode('signin')
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center p-4">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-2xl font-extrabold text-primary">DentalOS {mode === 'signin' ? 'Login' : 'Signup'}</h2>
          <p className="mb-6 text-sm text-slate-500">Supabase Authentication</p>
          <label className="text-sm font-semibold">Email</label>
          <Input className="mb-3 mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="text-sm font-semibold">Password</label>
          <Input className="mb-4 mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {message && <p className="mb-3 text-sm text-primary">{message}</p>}
          <Button className="w-full">{mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
          <Button
            className="mt-2 w-full"
            type="button"
            variant="ghost"
            onClick={() => setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))}
          >
            {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </Button>
        </form>
      </div>
    </AuthGuard>
  )
}
