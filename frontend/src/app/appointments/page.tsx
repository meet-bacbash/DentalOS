'use client'

import { Fragment, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import AppLayout from '../../layouts/AppLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Appointment,
  AppointmentStatus,
  PROCEDURES,
  PROVIDERS,
  avatarColor,
  formatMoney,
  initialsOf,
  makeAppointmentsMock,
} from '../../lib/opsMock'

type ViewMode = 'list' | 'week' | 'day'

function statusBadgeClass(status: AppointmentStatus) {
  if (status === 'Completed') return 'bg-[#ecfdf3] text-[#15803d]'
  if (status === 'Confirmed' || status === 'Checked In' || status === 'In Chair') return 'bg-[#eff6ff] text-[#1d4ed8]'
  if (status === 'No Show') return 'bg-[#fef2f2] text-[#b91c1c]'
  if (status === 'Cancelled') return 'bg-[#f3f4f6] text-[#6b7280]'
  return 'bg-[#fffbeb] text-[#b45309]'
}

function nextActions(status: AppointmentStatus): AppointmentStatus[] {
  if (status === 'Scheduled') return ['Confirmed', 'Cancelled']
  if (status === 'Confirmed') return ['Checked In', 'No Show']
  if (status === 'Checked In') return ['In Chair']
  if (status === 'In Chair') return ['Completed']
  return []
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString()
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(makeAppointmentsMock())
  const [view, setView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [bookOpen, setBookOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [bookingError, setBookingError] = useState('')
  const [bookForm, setBookForm] = useState({
    patientName: '',
    provider: PROVIDERS[0].name,
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    procedure: PROCEDURES[0],
    durationMin: 45,
    operatory: 'Chair 1',
    notes: '',
    reminderPreference: 'Both' as 'SMS' | 'Email' | 'Both' | 'None',
  })

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const q = search.trim().toLowerCase()
      if (q && !(a.patientName.toLowerCase().includes(q) || a.provider.toLowerCase().includes(q))) return false
      if (providerFilter !== 'all' && a.provider !== providerFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      const date = a.startAt.slice(0, 10)
      if (fromDate && date < fromDate) return false
      if (toDate && date > toDate) return false
      return true
    })
  }, [appointments, fromDate, providerFilter, search, statusFilter, toDate])

  const toToday = () => {
    const t = new Date().toISOString().slice(0, 10)
    setFromDate(t)
    setToDate(t)
  }

  const updateStatus = (id: string, next: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)))
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev))
  }

  const openBookAt = (date: string, time: string) => {
    setBookForm((prev) => ({ ...prev, date, time }))
    setBookOpen(true)
    setBookingError('')
  }

  const submitBooking = () => {
    const startIso = new Date(`${bookForm.date}T${bookForm.time}:00`).toISOString()
    const overlap = appointments.some(
      (a) => a.provider === bookForm.provider && a.startAt.slice(0, 16) === startIso.slice(0, 16) && a.status !== 'Cancelled',
    )
    if (overlap) {
      setBookingError('Provider is already booked in that time slot.')
      return
    }

    const newAppt: Appointment = {
      id: `APT-${9000 + appointments.length}`,
      patientName: bookForm.patientName || 'New Patient',
      patientId: `PT-${1500 + appointments.length}`,
      provider: bookForm.provider,
      procedure: bookForm.procedure,
      durationMin: Number(bookForm.durationMin),
      operatory: bookForm.operatory,
      status: 'Scheduled',
      startAt: startIso,
      reminderPreference: bookForm.reminderPreference,
      notes: bookForm.notes,
      outstandingBalance: 0,
      lastVisitDate: new Date().toISOString().slice(0, 10),
    }
    setAppointments((prev) => [newAppt, ...prev])
    setBookOpen(false)
  }

  const weekRows = useMemo(() => {
    const now = new Date()
    const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)

    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })

    const slots = Array.from({ length: 24 }).map((_, i) => {
      const hour = 7 + Math.floor(i / 2)
      const min = i % 2 === 0 ? 0 : 30
      return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    })

    return { days, slots }
  }, [])

  const detailDrawer = detailOpen && selected && (
    <div className="fixed inset-0 z-40">
      <button className="absolute inset-0 bg-black/25" onClick={() => setDetailOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] overflow-auto border-l border-[#e8e8e4] bg-white p-5">
        <h3 className="text-2xl font-extrabold">Appointment Detail</h3>
        <p className="text-sm text-[#6b7280]">{selected.patientName} • {selected.provider}</p>
        <div className="mt-3 rounded-lg border border-[#e8e8e4] p-3 text-sm">
          <p>{formatDate(selected.startAt)} {formatTime(selected.startAt)} • {selected.durationMin} min</p>
          <p>Procedure: {selected.procedure}</p>
          <p>Operatory: {selected.operatory}</p>
          <p>Reminder: {selected.reminderPreference}</p>
          <p>Last visit: {selected.lastVisitDate}</p>
          <p>Outstanding balance: {formatMoney(selected.outstandingBalance)}</p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ${statusBadgeClass(selected.status)}`}>{selected.status}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {nextActions(selected.status).map((a) => (
            <Button key={a} variant="ghost" onClick={() => updateStatus(selected.id, a)}>{a}</Button>
          ))}
        </div>

        {selected.status !== 'Cancelled' && (
          <div className="mt-3">
            <TextareaLabel label="Cancellation Reason" />
            <textarea className="w-full rounded-md border border-slate-300 p-2 text-sm" placeholder="Required if cancelling" />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="ghost" onClick={() => (window.location.href = `/patients/${selected.patientId}`)}>Open Patient Profile</Button>
          <Button variant="ghost" onClick={() => (window.location.href = '/ehr')}>Add Clinical Note</Button>
        </div>
      </aside>
    </div>
  )

  return (
    <AuthGuard>
      <AppLayout
        sectionLabel="SCHEDULING"
        title="Appointments"
        rightSlot={<Button variant="ghost" className="border-[#1a3c4d] text-[#1a3c4d]" onClick={() => setBookOpen(true)}>Book Appointment</Button>}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e8e8e4] bg-white p-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" className={view === 'list' ? 'border-[#1a3c4d] text-[#1a3c4d]' : ''} onClick={() => setView('list')}>List View</Button>
              <Button variant="ghost" className={view === 'week' ? 'border-[#1a3c4d] text-[#1a3c4d]' : ''} onClick={() => setView('week')}>Calendar Week</Button>
              <Button variant="ghost" className={view === 'day' ? 'border-[#1a3c4d] text-[#1a3c4d]' : ''} onClick={() => setView('day')}>Calendar Day</Button>
            </div>
            <Button variant="ghost" onClick={toToday}>Today</Button>
          </div>

          <div className="rounded-xl border border-[#e8e8e4] bg-white p-3">
            <div className="grid gap-2 md:grid-cols-5">
              <Input placeholder="Search patient/provider" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
                <option value="all">All Providers</option>
                {PROVIDERS.map((p) => <option key={p.id}>{p.name}</option>)}
              </select>
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                {['Scheduled', 'Confirmed', 'Checked In', 'In Chair', 'Completed', 'No Show', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
              </select>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          {view === 'list' && (
            <div className="overflow-auto rounded-xl border border-[#e8e8e4] bg-white">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="h-11 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">
                    <th className="px-3">Date & Time</th><th className="px-3">Patient</th><th className="px-3">Provider</th><th className="px-3">Procedure</th><th className="px-3">Duration</th><th className="px-3">Status</th><th className="px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="h-12 border-b border-[#f0f0ec] hover:bg-[#f9f9f7]">
                      <td className="px-3">{formatDate(a.startAt)} {formatTime(a.startAt)}</td>
                      <td className="px-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: avatarColor(a.patientName) }}>{initialsOf(a.patientName)}</span>
                          <span>{a.patientName}</span>
                        </div>
                      </td>
                      <td className="px-3">{a.provider}</td><td className="px-3">{a.procedure}</td><td className="px-3">{a.durationMin}m</td>
                      <td className="px-3"><span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusBadgeClass(a.status)}`}>{a.status}</span></td>
                      <td className="px-3">
                        <div className="flex flex-wrap gap-1">
                          {nextActions(a.status).map((act) => <Button key={act} variant="ghost" onClick={() => updateStatus(a.id, act)}>{act}</Button>)}
                          <Button variant="ghost" onClick={() => { setSelected(a); setDetailOpen(true) }}>View</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'week' && (
            <div className="overflow-auto rounded-xl border border-[#e8e8e4] bg-white p-3">
              <div className="grid min-w-[1100px] grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-1">
                <div />
                {weekRows.days.map((d) => <div key={d.toISOString()} className="text-center text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>)}
                {weekRows.slots.map((slot) => (
                  <Fragment key={`week-${slot}`}>
                    <div key={`t-${slot}`} className="text-xs text-[#6b7280]">{slot}</div>
                    {weekRows.days.map((d, dayIdx) => {
                      const date = d.toISOString().slice(0, 10)
                      const block = filtered.find((a) => a.startAt.slice(0, 10) === date && a.startAt.slice(11, 16) === slot)
                      if (block) {
                        const col = PROVIDERS.find((p) => p.name === block.provider)?.color || '#e5e7eb'
                        return (
                          <button
                            key={`${slot}-${dayIdx}`}
                            onClick={() => { setSelected(block); setDetailOpen(true) }}
                            className="min-h-10 rounded border border-[#d9ddd8] p-1 text-left text-xs"
                            style={{ background: col }}
                          >
                            <p className="font-semibold">{block.patientName}</p>
                            <p>{block.procedure}</p>
                            <p>{initialsOf(block.provider)}</p>
                          </button>
                        )
                      }
                      return <button key={`${slot}-${dayIdx}`} className="min-h-10 rounded border border-[#f0f0ec]" onClick={() => openBookAt(date, slot)} />
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className="overflow-auto rounded-xl border border-[#e8e8e4] bg-white p-3">
              <div className="grid min-w-[980px] grid-cols-[80px_repeat(3,minmax(0,1fr))] gap-1">
                <div />
                {PROVIDERS.map((p) => <div key={p.id} className="text-center text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">{p.name}</div>)}
                {weekRows.slots.map((slot) => {
                  const today = new Date().toISOString().slice(0, 10)
                  return (
                    <Fragment key={`day-${slot}`}>
                      <div key={`slot-${slot}`} className="text-xs text-[#6b7280]">{slot}</div>
                      {PROVIDERS.map((p) => {
                        const block = filtered.find((a) => a.provider === p.name && a.startAt.slice(0, 10) === today && a.startAt.slice(11, 16) === slot)
                        if (block) {
                          return (
                            <button key={`${slot}-${p.id}`} onClick={() => { setSelected(block); setDetailOpen(true) }} className="min-h-10 rounded border border-[#d9ddd8] p-1 text-left text-xs" style={{ background: p.color }}>
                              <p className="font-semibold">{block.patientName}</p><p>{block.procedure}</p>
                            </button>
                          )
                        }
                        return <button key={`${slot}-${p.id}`} className="min-h-10 rounded border border-[#f0f0ec]" onClick={() => openBookAt(today, slot)} />
                      })}
                    </Fragment>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {bookOpen && (
          <div className="fixed inset-0 z-40">
            <button className="absolute inset-0 bg-black/25" onClick={() => setBookOpen(false)} />
            <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-auto border-l border-[#e8e8e4] bg-white p-5">
              <h3 className="text-2xl font-extrabold">Book Appointment</h3>
              <div className="mt-3 grid gap-3">
                <Input placeholder="Patient (type to search)" value={bookForm.patientName} onChange={(e) => setBookForm({ ...bookForm, patientName: e.target.value })} />
                <button className="text-left text-sm text-[#1a3c4d] underline">+ Add New Patient</button>
                <select className="rounded-md border border-slate-300 p-2 text-sm" value={bookForm.provider} onChange={(e) => setBookForm({ ...bookForm, provider: e.target.value as any })}>{PROVIDERS.map((p) => <option key={p.id}>{p.name}</option>)}</select>
                <div className="grid grid-cols-2 gap-2"><Input type="date" value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} /><Input type="time" value={bookForm.time} onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })} /></div>
                <select className="rounded-md border border-slate-300 p-2 text-sm" value={bookForm.procedure} onChange={(e) => {
                  const proc = e.target.value as any
                  const suggested = proc === 'Exam' ? 30 : proc === 'Cleaning' ? 45 : 60
                  setBookForm({ ...bookForm, procedure: proc, durationMin: suggested })
                }}>{PROCEDURES.map((p) => <option key={p}>{p}</option>)}</select>
                <Input type="number" value={String(bookForm.durationMin)} onChange={(e) => setBookForm({ ...bookForm, durationMin: Number(e.target.value) })} />
                <select className="rounded-md border border-slate-300 p-2 text-sm" value={bookForm.operatory} onChange={(e) => setBookForm({ ...bookForm, operatory: e.target.value })}>{['Chair 1', 'Chair 2', 'Chair 3', 'Chair 4', 'Chair 5'].map((c) => <option key={c}>{c}</option>)}</select>
                <textarea className="w-full rounded-md border border-slate-300 p-2 text-sm" rows={3} placeholder="Notes" value={bookForm.notes} onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })} />
                <select className="rounded-md border border-slate-300 p-2 text-sm" value={bookForm.reminderPreference} onChange={(e) => setBookForm({ ...bookForm, reminderPreference: e.target.value as any })}>
                  {['SMS', 'Email', 'Both', 'None'].map((r) => <option key={r}>{r}</option>)}
                </select>
                {appointments.find((a) => a.patientName === bookForm.patientName && a.outstandingBalance > 0) && (
                  <p className="rounded-md bg-[#fffbeb] p-2 text-sm text-[#b45309]">Warning: patient has an outstanding balance.</p>
                )}
                {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
              </div>
              <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setBookOpen(false)}>Cancel</Button><Button onClick={submitBooking}>Save</Button></div>
            </aside>
          </div>
        )}

        {detailDrawer}
      </AppLayout>
    </AuthGuard>
  )
}

function TextareaLabel({ label }: { label: string }) {
  return <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">{label}</p>
}
