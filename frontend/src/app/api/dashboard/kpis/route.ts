import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, requireRole } from '@/lib/server/auth'
import { supabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    requireRole(user.role, ['admin', 'provider', 'front_desk'])

    const [{ count: apptCount }, { data: payments }, { count: noShowCount }, { count: pendingClaims }] = await Promise.all([
      supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('payments').select('amount'),
      supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'no_show'),
      supabaseAdmin.from('claims').select('*', { count: 'exact', head: true }).in('status', ['pending', 'submitted']),
    ])

    const revenue = (payments ?? []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const totalAppts = apptCount ?? 0
    const noShow = noShowCount ?? 0

    return NextResponse.json({
      todays_appointments: totalAppts,
      revenue,
      no_show_rate: totalAppts > 0 ? Number(((noShow / totalAppts) * 100).toFixed(2)) : 0,
      pending_claims: pendingClaims ?? 0,
    })
  } catch (error) {
    const msg = (error as Error).message
    return NextResponse.json({ detail: msg }, { status: msg === 'Forbidden' ? 403 : 401 })
  }
}
