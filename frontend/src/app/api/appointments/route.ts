import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, requireRole } from '@/lib/server/auth'
import { supabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    requireRole(user.role, ['admin', 'provider', 'front_desk'])

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .order('start_time', { ascending: true })

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
      patient_id: payload.patient_id,
      provider_id: payload.provider_id,
      start_time: payload.start_time,
      end_time: payload.end_time,
      reason: payload.reason ?? null,
      status: payload.status ?? 'scheduled',
    }

    const { data, error } = await supabaseAdmin.from('appointments').insert(body).select('*').single()
    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    console.log(`Mock reminder sent for appointment_id=${data.id}`)
    return NextResponse.json(data)
  } catch (error) {
    const msg = (error as Error).message
    return NextResponse.json({ detail: msg }, { status: msg === 'Forbidden' ? 403 : 401 })
  }
}
