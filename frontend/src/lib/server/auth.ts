import { NextRequest } from 'next/server'

import { supabaseAnon } from './supabaseAdmin'

export type AppRole = 'admin' | 'provider' | 'front_desk' | 'patient'

type CurrentUser = {
  id: string
  email: string | null
  role: AppRole
}

export async function getCurrentUser(request: NextRequest): Promise<CurrentUser> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw new Error('Missing bearer token')
  }

  const { data, error } = await supabaseAnon.auth.getUser(token)
  if (error || !data.user) {
    throw new Error('Invalid or expired auth token')
  }

  const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role || 'patient'
  const role = normalizeRole(metaRole)

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role,
  }
}

export function requireRole(userRole: AppRole, allowed: AppRole[]): void {
  if (!allowed.includes(userRole)) {
    throw new Error('Forbidden')
  }
}

function normalizeRole(value: unknown): AppRole {
  if (value === 'admin' || value === 'provider' || value === 'front_desk' || value === 'patient') {
    return value
  }
  return 'patient'
}
