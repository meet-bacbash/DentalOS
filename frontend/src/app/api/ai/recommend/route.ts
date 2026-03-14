import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

import { getCurrentUser, requireRole } from '@/lib/server/auth'

type Suggestion = {
  treatment: string
  priority: 'high' | 'medium' | 'low'
  cost_range: string
}

function fallbackSuggestions(): Suggestion[] {
  return [
    { treatment: 'Comprehensive exam + X-rays', priority: 'high', cost_range: '$150-$300' },
    { treatment: 'Prophylaxis cleaning', priority: 'medium', cost_range: '$90-$180' },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    requireRole(user.role, ['admin', 'provider', 'front_desk'])

    const payload = await request.json()
    const complaint = payload.complaint ?? ''
    const historySummary = payload.history_summary ?? ''

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ suggestions: fallbackSuggestions() })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a dental clinical assistant. Return JSON only with key suggestions as array of objects with treatment, priority, cost_range.',
        },
        {
          role: 'user',
          content: `Complaint: ${complaint}\nHistory: ${historySummary}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '{"suggestions":[]}'
    const parsed = JSON.parse(raw) as { suggestions?: Suggestion[] }

    return NextResponse.json({ suggestions: parsed.suggestions ?? fallbackSuggestions() })
  } catch {
    return NextResponse.json({ suggestions: fallbackSuggestions() })
  }
}
