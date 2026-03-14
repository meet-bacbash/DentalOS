import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, requireRole } from '@/lib/server/auth'
import { supabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    requireRole(user.role, ['admin', 'front_desk'])

    const payload = await request.json()
    const body = {
      patient_id: payload.patient_id,
      appointment_id: payload.appointment_id ?? null,
      amount: payload.amount,
      method: payload.method,
      note: payload.note ?? null,
    }

    const { data, error } = await supabaseAdmin.from('payments').insert(body).select('*').single()
    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    const msg = (error as Error).message
    return NextResponse.json({ detail: msg }, { status: msg === 'Forbidden' ? 403 : 401 })
  }
}
