'use client'

import { useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import AppLayout from '../../layouts/AppLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  ClinicalNote,
  ClinicalNoteType,
  PROVIDERS,
  avatarColor,
  initialsOf,
  makeAppointmentsMock,
  makeClinicalNotesMock,
} from '../../lib/opsMock'
import { useAuthContext } from '../../components/AuthContext'

type DrawerMode = 'view' | 'edit' | 'new'
type SoapField = 'subjective' | 'objective' | 'assessment' | 'plan'

type NoteForm = {
  patientName: string
  appointmentId: string
  type: ClinicalNoteType
  subjective: string
  objective: string
  assessment: string
  plan: string
  completedProcedures: string[]
}

function useSpeechToField(onText: (text: string) => void) {
  const start = () => {
    type SpeechRecognitionConstructor = new () => {
      lang: string
      interimResults: boolean
      maxAlternatives: number
      onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null
      start: () => void
    }
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const SR = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e) => onText(e.results?.[0]?.[0]?.transcript || '')
    rec.start()
  }
  return { start }
}

export default function ClinicalNotesPage() {
  const appointments = useMemo(() => makeAppointmentsMock(), [])
  const [notes, setNotes] = useState<ClinicalNote[]>(() => makeClinicalNotesMock(appointments))
  const { role, providerName } = useAuthContext()
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view')
  const [selected, setSelected] = useState<ClinicalNote | null>(null)
  const [form, setForm] = useState<NoteForm>({
    patientName: '',
    appointmentId: '',
    type: 'Exam',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    completedProcedures: [],
  })

  const scoped = useMemo(() => {
    if (role !== 'provider' || !providerName) return notes
    return notes.filter((n) => n.provider === providerName)
  }, [notes, role, providerName])

  const filtered = useMemo(() => {
    return scoped.filter((n) => {
      const q = search.trim().toLowerCase()
      if (q && !n.patientName.toLowerCase().includes(q)) return false
      if (providerFilter !== 'all' && n.provider !== providerFilter) return false
      if (typeFilter !== 'all' && n.type !== typeFilter) return false
      if (fromDate && n.date < fromDate) return false
      if (toDate && n.date > toDate) return false
      return true
    })
  }, [fromDate, providerFilter, scoped, search, toDate, typeFilter])

  const openDrawer = (mode: DrawerMode, note?: ClinicalNote) => {
    setDrawerMode(mode)
    setSelected(note || null)
    if (note) {
      setForm({
        patientName: note.patientName,
        appointmentId: note.linkedAppointmentId || '',
        type: note.type,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        completedProcedures: note.completedProcedures,
      })
    } else {
      setForm({ patientName: '', appointmentId: '', type: 'Exam', subjective: '', objective: '', assessment: '', plan: '', completedProcedures: [] })
    }
    setDrawerOpen(true)
  }

  const saveNote = () => {
    if (drawerMode === 'new') {
      const matchAppt = appointments.find((a) => a.id === form.appointmentId)
      const newNote: ClinicalNote = {
        id: `NOTE-${9000 + notes.length}`,
        date: new Date().toISOString().slice(0, 10),
        patientName: form.patientName,
        patientId: matchAppt?.patientId || 'PT-NEW',
        provider: matchAppt?.provider || PROVIDERS[0].name,
        type: form.type,
        subjective: form.subjective,
        objective: form.objective,
        assessment: form.assessment,
        plan: form.plan,
        linkedAppointmentId: form.appointmentId || undefined,
        completedProcedures: form.completedProcedures,
      }
      setNotes((prev) => [newNote, ...prev])
    }

    if (drawerMode === 'edit' && selected) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selected.id
            ? {
                ...n,
                type: form.type,
                subjective: form.subjective,
                objective: form.objective,
                assessment: form.assessment,
                plan: form.plan,
                completedProcedures: form.completedProcedures,
              }
            : n,
        ),
      )
    }

    setDrawerOpen(false)
  }

  const addSpeechHandlers = {
    s: useSpeechToField((text) => setForm((f) => ({ ...f, subjective: `${f.subjective}${f.subjective ? ' ' : ''}${text}` }))),
    o: useSpeechToField((text) => setForm((f) => ({ ...f, objective: `${f.objective}${f.objective ? ' ' : ''}${text}` }))),
    a: useSpeechToField((text) => setForm((f) => ({ ...f, assessment: `${f.assessment}${f.assessment ? ' ' : ''}${text}` }))),
    p: useSpeechToField((text) => setForm((f) => ({ ...f, plan: `${f.plan}${f.plan ? ' ' : ''}${text}` }))),
  }

  const soapSections: Array<{ label: string; field: 'subjective' | 'objective' | 'assessment' | 'plan'; speech: () => void }> = [
    { label: 'S — Subjective', field: 'subjective', speech: addSpeechHandlers.s.start },
    { label: 'O — Objective', field: 'objective', speech: addSpeechHandlers.o.start },
    { label: 'A — Assessment', field: 'assessment', speech: addSpeechHandlers.a.start },
    { label: 'P — Plan', field: 'plan', speech: addSpeechHandlers.p.start },
  ]

  const setSoapField = (field: SoapField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <AuthGuard>
      <AppLayout
        sectionLabel="CLINICAL"
        title="Clinical Notes"
        rightSlot={<Button variant="ghost" className="border-[#1a3c4d] text-[#1a3c4d]" onClick={() => openDrawer('new')}>New Note</Button>}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e8e8e4] bg-white p-3">
            <div className="grid gap-2 md:grid-cols-5">
              <Input placeholder="Search patient" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
                <option value="all">All Providers</option>
                {PROVIDERS.map((p) => <option key={p.id}>{p.name}</option>)}
              </select>
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Note Types</option>
                {(['Exam', 'Cleaning', 'Procedure', 'Emergency', 'Consultation'] as const).map((t) => <option key={t}>{t}</option>)}
              </select>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-[#e8e8e4] bg-white">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="h-11 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">
                  <th className="px-3">Date</th><th className="px-3">Patient</th><th className="px-3">Provider</th><th className="px-3">Visit Type</th><th className="px-3">Summary</th><th className="px-3">Linked Appointment</th><th className="px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.id} className="h-12 cursor-pointer border-b border-[#f0f0ec] hover:bg-[#f9f9f7]" onClick={() => openDrawer('view', n)}>
                    <td className="px-3">{n.date}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: avatarColor(n.patientName) }}>{initialsOf(n.patientName)}</span>
                        <span>{n.patientName}</span>
                      </div>
                    </td>
                    <td className="px-3">{n.provider}</td>
                    <td className="px-3"><span className="rounded-full bg-[#eef0ef] px-2 py-1 text-xs font-bold uppercase text-[#1a3c4d]">{n.type}</span></td>
                    <td className="px-3 max-w-[280px] truncate">{n.subjective}</td>
                    <td className="px-3">{n.linkedAppointmentId ? <span className="text-[#1a3c4d] underline">{n.linkedAppointmentId}</span> : '-'}</td>
                    <td className="px-3"><div className="flex gap-1"><Button variant="ghost" onClick={(e) => { e.stopPropagation(); openDrawer('view', n) }}>View</Button><Button variant="ghost" onClick={(e) => { e.stopPropagation(); openDrawer('edit', n) }}>Edit</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-40">
            <button className="absolute inset-0 bg-black/25" onClick={() => setDrawerOpen(false)} />
            <aside className="absolute right-0 top-0 h-full w-full max-w-[620px] overflow-auto border-l border-[#e8e8e4] bg-white p-5">
              <h3 className="text-2xl font-extrabold">{drawerMode === 'new' ? 'New Note' : drawerMode === 'edit' ? 'Edit Note' : 'Clinical Note'}</h3>
              <p className="text-sm text-[#6b7280]">{form.patientName || selected?.patientName || 'Patient'} • {selected?.date || new Date().toISOString().slice(0, 10)}</p>

              <div className="mt-3 space-y-3">
                {(drawerMode === 'new' || drawerMode === 'edit') && (
                  <>
                    <Input placeholder="Patient search" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
                    <select className="rounded-md border border-slate-300 p-2 text-sm" value={form.appointmentId} onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}>
                      <option value="">Link Appointment (optional)</option>
                      {appointments.filter((a) => !form.patientName || a.patientName.toLowerCase().includes(form.patientName.toLowerCase())).map((a) => <option key={a.id} value={a.id}>{a.id} • {a.patientName} • {a.startAt.slice(0, 10)}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      {(['Exam', 'Cleaning', 'Procedure', 'Emergency', 'Consultation'] as const).map((t) => (
                        <button key={t} className={`rounded-full border px-3 py-1 text-sm ${form.type === t ? 'border-[#1a3c4d] text-[#1a3c4d]' : 'border-[#e8e8e4]'}`} onClick={() => setForm({ ...form, type: t })}>{t}</button>
                      ))}
                    </div>
                  </>
                )}

                {soapSections.map(({ label, field, speech }) => (
                  <div key={field} className="rounded-md border border-[#e8e8e4] p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">{label}</p>
                      {(drawerMode === 'new' || drawerMode === 'edit') && <Button variant="ghost" onClick={speech}>Voice-to-text</Button>}
                    </div>
                    {drawerMode === 'view' ? (
                      <p className="text-sm">{selected ? selected[field] : ''}</p>
                    ) : (
                      <textarea
                        className="w-full rounded-md border border-slate-300 p-2 text-sm"
                        rows={4}
                        value={form[field]}
                        onChange={(e) => setSoapField(field, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                <div className="rounded-md border border-[#e8e8e4] p-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">Completed Procedures</p>
                  {(drawerMode === 'new' || drawerMode === 'edit') ? (
                    <div className="mt-2 grid gap-1">
                      {['Cleaning', 'Filling', 'Crown', 'Root Canal', 'Exam', 'Extraction'].map((proc) => (
                        <label key={proc} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.completedProcedures.includes(proc)}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                completedProcedures: e.target.checked ? [...prev.completedProcedures, proc] : prev.completedProcedures.filter((p) => p !== proc),
                              }))
                            }
                          />
                          {proc}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm">{selected?.completedProcedures.join(', ') || 'None'}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Close</Button>
                {(drawerMode === 'new' || drawerMode === 'edit') && <Button onClick={saveNote}>Save</Button>}
              </div>
            </aside>
          </div>
        )}
      </AppLayout>
    </AuthGuard>
  )
}
