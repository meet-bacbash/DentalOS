import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/server/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ detail: (error as Error).message }, { status: 401 })
  }
}
