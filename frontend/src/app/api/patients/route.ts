import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, requireRole } from '@/lib/server/auth'
import { supabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    requireRole(user.role, ['admin', 'provider', 'front_desk'])

    const q = request.nextUrl.searchParams.get('q')
    let query = supabaseAdmin
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (q) {
      query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    const msg = (error as Error).message
    return NextResponse.json({ detail: msg }, { status: msg === 'Forbidden' ? 403 : 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    requireRole(user.role, ['admin', 'provider', 'front_desk'])

    const payload = await request.json()
    const body = {
      first_name: payload.first_name,
      last_name: payload.last_name,
      dob: payload.dob ?? null,
      gender: payload.gender ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.address ?? null,
    }

    const { data, error } = await supabaseAdmin.from('patients').insert(body).select('*').single()
    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    const msg = (error as Error).message
    return NextResponse.json({ detail: msg }, { status: msg === 'Forbidden' ? 403 : 401 })
  }
}
