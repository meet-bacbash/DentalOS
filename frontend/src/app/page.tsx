'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthGuard from '../components/AuthGuard'
import AppLayout from '../layouts/AppLayout'
import { Button } from '../components/ui/button'
import { useAuthContext } from '../components/AuthContext'

type AppointmentStatus = 'scheduled' | 'checked_in' | 'in_chair' | 'completed' | 'no_show'
type ClaimStatus = 'pending' | 'submitted' | 'paid' | 'denied' | 'overdue'
type ProdMetric = 'production' | 'patients' | 'acceptance'
type RangeKey = 'today' | 'week' | 'month' | '30d' | 'custom'

type Appointment = {
  id: string
  clinicId: string
  providerName: string
  patientName: string
  procedure: string
  startAt: Date
  status: AppointmentStatus
  production: number
  collection: number
  isNewPatient: boolean
}

type Claim = {
  id: string
  clinicId: string
  providerName: string
  amount: number
  createdAt: Date
  status: ClaimStatus
}

type AlertItem = {
  id: string
  type: string
  severity: 'high' | 'medium' | 'low'
  message: string
  action: string
  createdAt: Date
}

type Location = {
  id: string
  name: string
  city: string
  isOpenToday: boolean
}

type Provider = {
  id: string
  name: string
  clinicId: string
  monthlyGoal: number
  patientsGoal: number
  acceptanceGoal: number
}

const LOCATIONS: Location[] = [
  { id: 'downtown', name: 'Downtown Clinic', city: 'Seattle', isOpenToday: true },
  { id: 'westside', name: 'Westside Dental', city: 'Tacoma', isOpenToday: true },
  { id: 'north-campus', name: 'North Campus', city: 'Bellevue', isOpenToday: false },
]

const PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Dr. Sarah Chen', clinicId: 'downtown', monthlyGoal: 220000, patientsGoal: 260, acceptanceGoal: 74 },
  { id: 'p2', name: 'Dr. Marcus Webb', clinicId: 'westside', monthlyGoal: 198000, patientsGoal: 245, acceptanceGoal: 71 },
  { id: 'p3', name: 'Dr. Priya Patel', clinicId: 'north-campus', monthlyGoal: 210000, patientsGoal: 250, acceptanceGoal: 76 },
]

const PATIENTS = [
  'Avery Brooks',
  'Noah Garcia',
  'Mia Johnson',
  'Elijah Davis',
  'Sophia Patel',
  'Lucas Turner',
  'Olivia Reed',
  'Ethan Price',
  'Emma Flores',
  'Liam Hayes',
  'Ava Kim',
  'Mason White',
  'Isabella Ward',
  'James Cooper',
  'Charlotte Lopez',
  'Benjamin Ross',
  'Harper Gray',
  'Logan Hughes',
  'Amelia Scott',
  'Jacob Adams',
]

const PROCEDURES = ['Recall Exam', 'Crown Prep', 'Root Canal', 'Composite Filling', 'Implant Consult', 'Whitening Follow-up']
const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'custom', label: 'Custom' },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function seeded(n: number) {
  const x = Math.sin(n * 999) * 10000
  return x - Math.floor(x)
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function rangeBounds(range: RangeKey, fromParam?: string | null, toParam?: string | null) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  if (range === 'today') return { start: todayStart, end: todayEnd }
  if (range === 'week') {
    const day = now.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset))
    return { start, end: todayEnd }
  }
  if (range === 'month') {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    return { start, end: todayEnd }
  }
  if (range === '30d') {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29))
    return { start, end: todayEnd }
  }

  const from = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6))
  const to = toParam ? endOfDay(new Date(toParam)) : todayEnd
  return { start: from, end: to }
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / prev) * 100
}

function money(v: number) {
  return `$${Math.round(v).toLocaleString()}`
}

function percent(v: number) {
  return `${v.toFixed(1)}%`
}

function formatDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

function minutesAgo(date: Date, now: Date) {
  const min = Math.max(1, Math.round((now.getTime() - date.getTime()) / 60000))
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.round(hr / 24)}d ago`
}

function alertFactory(seedIdx: number): AlertItem {
  const templates: Array<Omit<AlertItem, 'id' | 'createdAt'>> = [
    { type: 'claim_denied', severity: 'high', message: 'Insurance claim denied for patient Avery Brooks — resubmission required.', action: 'Review' },
    { type: 'no_show', severity: 'medium', message: 'Patient marked no-show for 10:00 AM Downtown slot.', action: 'Review' },
    { type: 'insurance_expiring', severity: 'medium', message: '4 patients have insurance expiring within 30 days.', action: 'Review' },
    { type: 'balance_overdue', severity: 'high', message: '9 patient balances overdue 60+ days.', action: 'Review' },
    { type: 'gap', severity: 'low', message: 'Dr. Marcus Webb has a 90-minute gap this afternoon.', action: 'Fill Gap' },
    { type: 'inventory', severity: 'medium', message: 'Composite resin supply below reorder threshold.', action: 'Reorder' },
  ]
  const t = templates[seedIdx % templates.length]
  return {
    id: `a-${seedIdx}`,
    ...t,
    createdAt: new Date(Date.now() - (seedIdx % 12) * 15 * 60000),
  }
}

function statusClass(status: AppointmentStatus) {
  if (status === 'completed') return 'bg-[#ecfdf3] text-[#15803d]'
  if (status === 'checked_in') return 'bg-[#eff6ff] text-[#1d4ed8]'
  if (status === 'in_chair') return 'bg-[#f0fdfa] text-[#0f766e]'
  if (status === 'no_show') return 'bg-[#fef2f2] text-[#b91c1c]'
  return 'bg-[#f3f4f6] text-[#374151]'
}

function claimClass(status: ClaimStatus) {
  if (status === 'paid') return 'bg-[#ecfdf3] text-[#15803d]'
  if (status === 'pending' || status === 'submitted') return 'bg-[#fffbeb] text-[#b45309]'
  return 'bg-[#fef2f2] text-[#b91c1c]'
}

function dayLabel(d: number) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
}

function DashboardPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role, clinicId, providerName } = useAuthContext()
  const [alerts, setAlerts] = useState<AlertItem[]>([alertFactory(0), alertFactory(1), alertFactory(2), alertFactory(3)])
  const [quickOpen, setQuickOpen] = useState(false)

  const range = (searchParams.get('range') as RangeKey) || '30d'
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const locationParam = searchParams.get('location') || 'all'
  const chartView = searchParams.get('chart') || 'daily'
  const prodMetric = (searchParams.get('prodMetric') as ProdMetric) || 'production'

  const { start, end } = useMemo(() => rangeBounds(range, fromParam, toParam), [range, fromParam, toParam])

  const records = useMemo(() => {
    const appts: Appointment[] = []
    const claims: Claim[] = []
    const today = startOfDay(new Date())

    for (let dayOffset = -140; dayOffset <= 0; dayOffset += 1) {
      const baseDate = new Date(today)
      baseDate.setDate(today.getDate() + dayOffset)

      PROVIDERS.forEach((provider, pIdx) => {
        const volume = 6 + Math.floor(seeded(dayOffset * 37 + pIdx * 11) * 4)
        for (let i = 0; i < volume; i += 1) {
          const hour = 8 + (i % 10)
          const minute = i % 2 === 0 ? 0 : 30
          const startAt = new Date(baseDate)
          startAt.setHours(hour, minute, 0, 0)

          const rand = seeded(dayOffset * 100 + pIdx * 10 + i)
          let status: AppointmentStatus = 'scheduled'
          if (dayOffset < 0) {
            status = rand < 0.11 ? 'no_show' : 'completed'
          } else {
            status = rand < 0.08 ? 'no_show' : rand < 0.18 ? 'checked_in' : rand < 0.25 ? 'in_chair' : rand < 0.45 ? 'completed' : 'scheduled'
          }

          const production = status === 'completed' || status === 'in_chair' ? 260 + Math.round(seeded(i + pIdx + dayOffset + 2) * 420) : 0
          const collection = status === 'completed' ? Math.round(production * (0.75 + seeded(i + pIdx + 3) * 0.1)) : 0

          const patientName = PATIENTS[(Math.abs(dayOffset) + i + pIdx) % PATIENTS.length]
          const procedure = PROCEDURES[(i + pIdx) % PROCEDURES.length]

          appts.push({
            id: `${provider.id}-${dayOffset}-${i}`,
            clinicId: provider.clinicId,
            providerName: provider.name,
            patientName,
            procedure,
            startAt,
            status,
            production,
            collection,
            isNewPatient: seeded(dayOffset * 17 + i) < 0.13,
          })

          if (status === 'completed' || status === 'no_show') {
            const claimRand = seeded(dayOffset * 51 + i * 7)
            const claimStatus: ClaimStatus = claimRand < 0.6 ? 'paid' : claimRand < 0.85 ? 'pending' : claimRand < 0.95 ? 'submitted' : 'denied'
            const isOverdue = claimStatus === 'pending' && dayOffset < -35
            claims.push({
              id: `c-${provider.id}-${dayOffset}-${i}`,
              clinicId: provider.clinicId,
              providerName: provider.name,
              amount: Math.round((180 + seeded(i * 9 + pIdx) * 260) * 100) / 100,
              createdAt: startAt,
              status: isOverdue ? 'overdue' : claimStatus,
            })
          }
        }
      })
    }

    return { appts, claims }
  }, [])

  const scopedLocation = role === 'dso_admin' ? locationParam : clinicId || 'downtown'

  const scopedAppointments = useMemo(() => {
    return records.appts.filter((a) => {
      if (scopedLocation !== 'all' && a.clinicId !== scopedLocation) return false
      if (role === 'provider' && providerName && a.providerName !== providerName) return false
      return true
    })
  }, [records.appts, scopedLocation, role, providerName])

  const scopedClaims = useMemo(() => {
    return records.claims.filter((c) => {
      if (scopedLocation !== 'all' && c.clinicId !== scopedLocation) return false
      if (role === 'provider' && providerName && c.providerName !== providerName) return false
      return true
    })
  }, [records.claims, scopedLocation, role, providerName])

  const inRangeAppointments = useMemo(() => scopedAppointments.filter((a) => a.startAt >= start && a.startAt <= end), [scopedAppointments, start, end])
  const inRangeClaims = useMemo(() => scopedClaims.filter((c) => c.createdAt >= start && c.createdAt <= end), [scopedClaims, start, end])

  const previousRange = useMemo(() => {
    const span = end.getTime() - start.getTime() + 1
    return { start: new Date(start.getTime() - span), end: new Date(end.getTime() - span) }
  }, [start, end])

  const prevRangeAppointments = useMemo(
    () => scopedAppointments.filter((a) => a.startAt >= previousRange.start && a.startAt <= previousRange.end),
    [scopedAppointments, previousRange],
  )

  const kpis = useMemo(() => {
    const today = startOfDay(new Date())
    const todayAppts = inRangeAppointments.filter((a) => startOfDay(a.startAt).getTime() === today.getTime()).length
    const prevTodayAppts = prevRangeAppointments.filter((a) => startOfDay(a.startAt).getTime() === today.getTime()).length

    const production = inRangeAppointments.reduce((s, a) => s + a.production, 0)
    const prevProduction = prevRangeAppointments.reduce((s, a) => s + a.production, 0)

    const collections = inRangeAppointments.reduce((s, a) => s + a.collection, 0)
    const prevCollections = prevRangeAppointments.reduce((s, a) => s + a.collection, 0)

    const noShowCount = inRangeAppointments.filter((a) => a.status === 'no_show').length
    const noShowRate = inRangeAppointments.length ? (noShowCount / inRangeAppointments.length) * 100 : 0

    const prevNoShowCount = prevRangeAppointments.filter((a) => a.status === 'no_show').length
    const prevNoShowRate = prevRangeAppointments.length ? (prevNoShowCount / prevRangeAppointments.length) * 100 : 0

    return [
      {
        label: "Today's Appointments",
        value: String(todayAppts),
        descriptor: `${pctChange(todayAppts, prevTodayAppts) >= 0 ? '↑' : '↓'} ${Math.abs(pctChange(todayAppts, prevTodayAppts)).toFixed(1)}% vs prior`,
      },
      {
        label: 'Production',
        value: money(production),
        descriptor: `${pctChange(production, prevProduction) >= 0 ? '↑' : '↓'} ${Math.abs(pctChange(production, prevProduction)).toFixed(1)}% vs prior`,
      },
      {
        label: 'Collections',
        value: money(collections),
        descriptor: `${pctChange(collections, prevCollections) >= 0 ? '↑' : '↓'} ${Math.abs(pctChange(collections, prevCollections)).toFixed(1)}% vs prior`,
      },
      {
        label: 'No-Show Rate',
        value: percent(noShowRate),
        descriptor: `${pctChange(noShowRate, prevNoShowRate) <= 0 ? '↓' : '↑'} ${Math.abs(pctChange(noShowRate, prevNoShowRate)).toFixed(1)}% vs prior`,
      },
    ]
  }, [inRangeAppointments, prevRangeAppointments])

  const claimsBreakdown = useMemo(() => {
    const map: Record<ClaimStatus, number> = { pending: 0, submitted: 0, paid: 0, denied: 0, overdue: 0 }
    inRangeClaims.forEach((c) => {
      map[c.status] += 1
    })
    return map
  }, [inRangeClaims])

  const providerRows = useMemo(() => {
    const providerScope = role === 'provider' && providerName ? PROVIDERS.filter((p) => p.name === providerName) : PROVIDERS
    return providerScope
      .filter((p) => (scopedLocation === 'all' ? true : p.clinicId === scopedLocation))
      .map((p) => {
        const list = inRangeAppointments.filter((a) => a.providerName === p.name)
        const production = list.reduce((s, a) => s + a.production, 0)
        const patients = list.length
        const accepted = list.filter((a) => a.status === 'completed' || a.status === 'in_chair').length
        const acceptance = patients ? (accepted / patients) * 100 : 0

        let value = production
        let goal = p.monthlyGoal
        if (prodMetric === 'patients') {
          value = patients
          goal = p.patientsGoal
        }
        if (prodMetric === 'acceptance') {
          value = acceptance
          goal = p.acceptanceGoal
        }

        const ratio = goal ? value / goal : 0
        const tone = ratio >= 1 ? 'bg-[#2a9d8f]' : ratio >= 0.85 ? 'bg-amber-500' : 'bg-red-500'

        return { provider: p, value, goal, ratio, tone }
      })
  }, [inRangeAppointments, prodMetric, role, providerName, scopedLocation])

  const noShowHeatmap = useMemo(() => {
    const grid: Array<{ day: number; block: string; count: number; pct: number }> = []
    const blocks = ['Morning', 'Midday', 'Afternoon', 'Evening']

    for (let day = 0; day < 7; day += 1) {
      for (let b = 0; b < blocks.length; b += 1) {
        const blockName = blocks[b]
        const blockMatches = inRangeAppointments.filter((a) => {
          const h = a.startAt.getHours()
          const block = h < 11 ? 'Morning' : h < 14 ? 'Midday' : h < 17 ? 'Afternoon' : 'Evening'
          return a.startAt.getDay() === day && block === blockName
        })
        const noShows = blockMatches.filter((a) => a.status === 'no_show').length
        const pct = blockMatches.length ? (noShows / blockMatches.length) * 100 : 0
        grid.push({ day, block: blockName, count: noShows, pct })
      }
    }

    return grid
  }, [inRangeAppointments])

  const timeline = useMemo(() => {
    const today = startOfDay(new Date())
    return scopedAppointments
      .filter((a) => startOfDay(a.startAt).getTime() === today.getTime())
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
  }, [scopedAppointments])

  const productionSeries = useMemo(() => {
    if (chartView === 'monthly') {
      const rows: Array<{ label: string; production: number; collections: number }> = []
      for (let i = 11; i >= 0; i -= 1) {
        const d = new Date()
        d.setMonth(d.getMonth() - i, 1)
        const mStart = startOfDay(new Date(d.getFullYear(), d.getMonth(), 1))
        const mEnd = endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0))
        const list = scopedAppointments.filter((a) => a.startAt >= mStart && a.startAt <= mEnd)
        rows.push({
          label: `${mStart.toLocaleString('en-US', { month: 'short' })} ${String(mStart.getFullYear()).slice(2)}`,
          production: list.reduce((s, a) => s + a.production, 0),
          collections: list.reduce((s, a) => s + a.collection, 0),
        })
      }
      return rows
    }

    const rows: Array<{ label: string; production: number; collections: number }> = []
    for (let i = 29; i >= 0; i -= 1) {
      const d = startOfDay(new Date())
      d.setDate(d.getDate() - i)
      const dayList = scopedAppointments.filter((a) => startOfDay(a.startAt).getTime() === d.getTime())
      rows.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        production: dayList.reduce((s, a) => s + a.production, 0),
        collections: dayList.reduce((s, a) => s + a.collection, 0),
      })
    }
    return rows
  }, [chartView, scopedAppointments])

  useEffect(() => {
    const timer = setInterval(() => {
      setAlerts((prev) => [alertFactory(prev.length + 1), ...prev].slice(0, 8))
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const now = new Date()

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set(key, value)
    router.replace(`/?${next.toString()}`)
  }

  const headerControls = (
    <div className="flex flex-wrap items-center gap-2">
      {role === 'dso_admin' && (
        <select
          value={locationParam}
          onChange={(e) => setParam('location', e.target.value)}
          className="rounded-lg border border-[#e8e8e4] bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Locations</option>
          {LOCATIONS.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.city}) {loc.isOpenToday ? '●' : '○'}
            </option>
          ))}
        </select>
      )}

      <select value={range} onChange={(e) => setParam('range', e.target.value)} className="rounded-lg border border-[#e8e8e4] bg-white px-3 py-2 text-sm">
        {RANGE_OPTIONS.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>

      {range === 'custom' && (
        <>
          <input
            type="date"
            value={fromParam || formatDateInput(start)}
            onChange={(e) => setParam('from', e.target.value)}
            className="rounded-lg border border-[#e8e8e4] bg-white px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={toParam || formatDateInput(end)}
            onChange={(e) => setParam('to', e.target.value)}
            className="rounded-lg border border-[#e8e8e4] bg-white px-3 py-2 text-sm"
          />
        </>
      )}
    </div>
  )

  return (
    <AuthGuard>
      <AppLayout rightSlot={headerControls}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-xl border border-[#e8e8e4] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">{k.label}</p>
                  <p className="mt-3 text-[38px] font-extrabold leading-none text-[#1a1a1a]">{k.value}</p>
                  <p className="mt-2 text-sm text-[#6b7280]">{k.descriptor}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#e8e8e4] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Banking Operations</p>
              <div className="mt-1 flex items-center justify-between">
                <h3 className="text-[30px] font-extrabold text-[#1a1a1a]">Production vs Collections</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className={chartView === 'daily' ? 'border-[#1a3c4d] text-[#1a3c4d]' : ''} onClick={() => setParam('chart', 'daily')}>
                    Daily
                  </Button>
                  <Button variant="ghost" className={chartView === 'monthly' ? 'border-[#1a3c4d] text-[#1a3c4d]' : ''} onClick={() => setParam('chart', 'monthly')}>
                    Monthly
                  </Button>
                </div>
              </div>
              <p className="text-sm text-[#6b7280]">Goal line: {money(205000)} monthly production target (dashed reference)</p>

              <div className="mt-4 space-y-2">
                {productionSeries.slice(-12).map((row) => {
                  const maxVal = Math.max(...productionSeries.map((x) => Math.max(x.production, x.collections)), 1)
                  const prodW = (row.production / maxVal) * 100
                  const colW = (row.collections / maxVal) * 100
                  const variance = row.production - row.collections
                  return (
                    <div key={row.label} className="grid grid-cols-[72px_1fr_110px] items-center gap-3 text-sm">
                      <span className="text-[#6b7280]">{row.label}</span>
                      <div className="relative h-6 rounded-md bg-[#f4f4f2]">
                        <div className="absolute left-0 top-0 h-6 rounded-md bg-[#1a3c4d]" style={{ width: `${prodW}%` }} />
                        <div className="absolute left-0 top-2 h-2 rounded bg-[#2a9d8f]" style={{ width: `${colW}%` }} />
                        <div className="absolute left-[82%] top-0 h-6 border-l border-dashed border-[#9ca3af]" />
                      </div>
                      <span className="text-right text-[#6b7280]">Δ {money(variance)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-[#e8e8e4] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Insurance</p>
                <h3 className="mt-1 text-[30px] font-extrabold text-[#1a1a1a]">Claims Breakdown</h3>
                <div className="mt-4 space-y-3">
                  {(Object.keys(claimsBreakdown) as ClaimStatus[]).map((status) => {
                    const total = Object.values(claimsBreakdown).reduce((s, n) => s + n, 0) || 1
                    const val = claimsBreakdown[status]
                    const pct = (val / total) * 100
                    return (
                      <button
                        key={status}
                        onClick={() => router.push(`/billing?claimStatus=${status}`)}
                        className="w-full rounded-lg border border-[#e8e8e4] px-3 py-2 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${claimClass(status)}`}>{status}</span>
                          <span className="text-sm font-semibold text-[#1a1a1a]">{val}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#eef0ef]">
                          <div className="h-1.5 rounded-full bg-[#2a9d8f]" style={{ width: `${pct}%` }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-[#e8e8e4] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Analytics</p>
                    <h3 className="mt-1 text-[30px] font-extrabold text-[#1a1a1a]">Provider Productivity</h3>
                  </div>
                  <select value={prodMetric} onChange={(e) => setParam('prodMetric', e.target.value)} className="rounded-lg border border-[#e8e8e4] px-2 py-1 text-sm">
                    <option value="production">Production</option>
                    <option value="patients">Patients Seen</option>
                    <option value="acceptance">Acceptance Rate</option>
                  </select>
                </div>

                <div className="mt-4 space-y-4">
                  {providerRows.map((row) => (
                    <div key={row.provider.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eef0ef] text-xs font-bold text-[#1a3c4d]">
                            {initials(row.provider.name)}
                          </span>
                          <span className="font-semibold">{row.provider.name}</span>
                        </div>
                        <span className="text-[#6b7280]">
                          {prodMetric === 'production' ? money(row.value) : prodMetric === 'patients' ? Math.round(row.value) : percent(row.value)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#edf0ef]">
                        <div className={`h-2 rounded-full ${row.tone}`} style={{ width: `${Math.min(100, row.ratio * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-[#e8e8e4] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Patterns</p>
                <h3 className="mt-1 text-[30px] font-extrabold text-[#1a1a1a]">No-Show Heatmap</h3>
                <div className="mt-4 grid grid-cols-[80px_repeat(4,minmax(0,1fr))] gap-2 text-xs">
                  <div />
                  {['Morning', 'Midday', 'Afternoon', 'Evening'].map((b) => (
                    <div key={b} className="text-center font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                      {b}
                    </div>
                  ))}
                  {Array.from({ length: 7 }).map((_, day) => (
                    <div key={`row-${day}`} className="contents">
                      <div className="flex items-center text-[#6b7280]">
                        {dayLabel(day)}
                      </div>
                      {['Morning', 'Midday', 'Afternoon', 'Evening'].map((block) => {
                        const cell = noShowHeatmap.find((x) => x.day === day && x.block === block)
                        const intensity = cell ? Math.min(1, cell.pct / 24) : 0
                        const bg = `rgba(185, 28, 28, ${0.08 + intensity * 0.72})`
                        return (
                          <div
                            key={`${day}-${block}`}
                            className="h-10 rounded-md border border-[#e8e8e4]"
                            style={{ background: bg }}
                            title={`${block} ${dayLabel(day)}: ${cell?.count ?? 0} no-shows (${(cell?.pct ?? 0).toFixed(1)}%)`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#e8e8e4] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Schedule</p>
                <h3 className="mt-1 text-[30px] font-extrabold text-[#1a1a1a]">Today's Appointment Timeline</h3>
                <div className="mt-4 max-h-[330px] space-y-2 overflow-auto pr-1">
                  {timeline.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-[#e8e8e4] px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#1a3c4d]">{a.startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef0ef] text-xs font-bold">{initials(a.patientName)}</span>
                        <div>
                          <p className="font-semibold text-[#1a1a1a]">{a.patientName}</p>
                          <p className="text-xs text-[#6b7280]">{a.providerName} • {a.procedure}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusClass(a.status)} ${a.status === 'in_chair' ? 'animate-pulse' : ''}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-[#e8e8e4] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Alerts</p>
              <h3 className="mt-1 text-[30px] font-extrabold text-[#1a1a1a]">Operational Feed</h3>
              <div className="mt-4 space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="rounded-lg border border-[#e8e8e4] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-[#1a1a1a]">{a.message}</p>
                        <p className="mt-1 text-xs text-[#6b7280]">{minutesAgo(a.createdAt, now)}</p>
                      </div>
                      <span className={`mt-0.5 inline-flex h-2.5 w-2.5 rounded-full ${a.severity === 'high' ? 'bg-red-500' : a.severity === 'medium' ? 'bg-amber-500' : 'bg-[#2a9d8f]'}`} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Button variant="ghost" className="px-2 py-1 text-xs">
                        {a.action}
                      </Button>
                      <button onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))} className="text-xs text-[#6b7280]">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="fixed bottom-6 right-6 z-30">
          {quickOpen && (
            <div className="absolute bottom-14 right-0 flex w-44 flex-col gap-2">
              {[
                ['New Appointment', '/appointments'],
                ['Add Patient', '/patients'],
                ['Record Payment', '/billing'],
                ['Submit Claim', '/billing?tab=claims'],
                ['Send Reminder', '/appointments'],
              ].map(([label, href]) => (
                <button
                  key={label}
                  onClick={() => {
                    setQuickOpen(false)
                    router.push(href)
                  }}
                  className="rounded-full border border-[#e8e8e4] bg-white px-4 py-2 text-left text-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setQuickOpen((v) => !v)}
            className="h-14 w-14 rounded-full bg-[#1a3c4d] text-2xl font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
          >
            {quickOpen ? '×' : '+'}
          </button>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f4f0]" />}>
      <DashboardPageInner />
    </Suspense>
  )
}
