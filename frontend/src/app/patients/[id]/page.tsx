'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '../../../components/AuthGuard'
import AppLayout from '../../../layouts/AppLayout'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import PatientDrawer from '../../../components/patients/PatientDrawer'
import { PATIENTS_MOCK, PatientRecord, ageOf, avatarColorFor, fullName, initialsOf } from '../../../lib/patientsMock'
import { useAuthContext } from '../../../components/AuthContext'

type TabKey = 'overview' | 'appointments' | 'treatment' | 'notes' | 'documents' | 'billing'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'treatment', label: 'Treatment Plans' },
  { key: 'notes', label: 'Clinical Notes' },
  { key: 'documents', label: 'Documents' },
  { key: 'billing', label: 'Billing' },
]

type ToothCondition = 'healthy' | 'restoration' | 'decay' | 'missing' | 'crown' | 'root_canal' | 'implant'
const toothStyles: Record<ToothCondition, string> = {
  healthy: 'fill-white stroke-[#9ca3af]',
  restoration: 'fill-blue-200 stroke-blue-500',
  decay: 'fill-red-200 stroke-red-500',
  missing: 'fill-[#ececec] stroke-[#9ca3af]',
  crown: 'fill-amber-200 stroke-amber-500',
  root_canal: 'fill-purple-200 stroke-purple-600',
  implant: 'fill-teal-200 stroke-teal-600',
}

function flagChips(patient: PatientRecord) {
  const chips: Array<{ label: string; cls: string }> = []
  if (patient.balance > 0) chips.push({ label: 'Outstanding Balance', cls: 'bg-[#fef2f2] text-[#b91c1c]' })
  if (patient.insurance.status === 'expired' || patient.insurance.status === 'pending_verification') {
    chips.push({ label: 'Insurance Expiring Soon', cls: 'bg-[#fffbeb] text-[#b45309]' })
  }
  if (!patient.lastVisit || (Date.now() - new Date(patient.lastVisit.date).getTime()) / (1000 * 3600 * 24) > 180) {
    chips.push({ label: 'Overdue Recall', cls: 'bg-[#fffbeb] text-[#b45309]' })
  }
  if (patient.medicalAlerts.length > 0) chips.push({ label: 'Medical Alert', cls: 'bg-[#fef2f2] text-[#b91c1c]' })
  if (patient.specialNotes) chips.push({ label: 'VIP / Special Notes', cls: 'bg-[#eff6ff] text-[#1d4ed8]' })
  return chips
}

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { role } = useAuthContext()

  const [records, setRecords] = useState(PATIENTS_MOCK)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [noteFilterType, setNoteFilterType] = useState('all')
  const [noteProviderFilter, setNoteProviderFilter] = useState('all')
  const [noteDateFrom, setNoteDateFrom] = useState('')
  const [noteDateTo, setNoteDateTo] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [expandedVisits, setExpandedVisits] = useState<Record<string, boolean>>({})
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({})
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({})
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [docTypeFilter, setDocTypeFilter] = useState('all')
  const [apptYearFilter, setApptYearFilter] = useState('all')
  const [apptProviderFilter, setApptProviderFilter] = useState('all')
  const [apptStatusFilter, setApptStatusFilter] = useState('all')

  const patient = useMemo(() => records.find((p) => p.id === id), [records, id])

  const setPatientPatch = (patch: Partial<PatientRecord>) => {
    setRecords((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  if (!patient) {
    return (
      <AuthGuard>
        <AppLayout sectionLabel="PATIENT MANAGEMENT" title="Patient Not Found">
          <div className="rounded-xl border border-[#e8e8e4] bg-white p-6">
            <p className="text-[#6b7280]">Patient record not found.</p>
            <Button className="mt-3" onClick={() => router.push('/patients')}>Back to Patients</Button>
          </div>
        </AppLayout>
      </AuthGuard>
    )
  }

  const name = fullName(patient)
  const chips = flagChips(patient)

  const upcoming = patient.appointments.filter((a) => new Date(a.date).getTime() >= new Date().setHours(0, 0, 0, 0))
  const past = patient.appointments.filter((a) => new Date(a.date).getTime() < new Date().setHours(0, 0, 0, 0))

  const filteredPast = past.filter((a) => {
    if (apptYearFilter !== 'all' && !a.date.startsWith(apptYearFilter)) return false
    if (apptProviderFilter !== 'all' && a.provider !== apptProviderFilter) return false
    if (apptStatusFilter !== 'all' && a.status !== apptStatusFilter) return false
    return true
  })

  const filteredNotes = patient.clinicalNotes.filter((n) => {
    if (noteFilterType !== 'all' && n.type !== noteFilterType) return false
    if (noteProviderFilter !== 'all' && n.provider !== noteProviderFilter) return false
    if (noteDateFrom && n.date < noteDateFrom) return false
    if (noteDateTo && n.date > noteDateTo) return false
    return true
  })

  const filteredDocs = patient.documents.filter((d) => (docTypeFilter === 'all' ? true : d.type === docTypeFilter))

  const topRight = (
    <div className="flex gap-2">
      <Button variant="ghost" className="border-[#e8e8e4]" onClick={() => router.push('/appointments')}>Schedule Appointment</Button>
      <Button variant="ghost" className="border-[#e8e8e4]" onClick={() => router.push('/billing')}>Record Payment</Button>
      <Button variant="ghost" className="border-[#e8e8e4]">Send Message</Button>
    </div>
  )

  return (
    <AuthGuard>
      <AppLayout sectionLabel="PATIENT MANAGEMENT" title={name} rightSlot={topRight}>
        <div className="space-y-4">
          <div className="text-sm text-[#6b7280]">
            <Link href="/patients" className="hover:underline">← Patients</Link>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-extrabold text-[#1a1a1a]">{name}</h2>
              <p className="text-[#6b7280]">{patient.id} • Registered {patient.registrationDate}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                patient.status === 'active' ? 'bg-[#ecfdf3] text-[#15803d]' : patient.status === 'new' ? 'bg-[#fffbeb] text-[#b45309]' : 'bg-[#f3f4f6] text-[#6b7280]'
              }`}
            >
              {patient.status}
            </span>
          </div>

          <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Personal Details</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold" style={{ background: avatarColorFor(name) }}>
                    {initialsOf(name)}
                  </span>
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-[#6b7280]">{patient.gender}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <p>DOB: {patient.dob} ({ageOf(patient.dob)}y)</p>
                  <p>Phone: {patient.phone}</p>
                  <p>Email: {patient.email}</p>
                  <p>Address: {patient.address}</p>
                  <p>Language: {patient.preferredLanguage}</p>
                  <p>Emergency: {patient.emergencyContact.name} ({patient.emergencyContact.phone})</p>
                </div>
                <Button className="mt-4 w-full" variant="ghost" onClick={() => setOpenDrawer(true)}>Edit</Button>
              </div>

              <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Insurance</p>
                <div className="mt-2 text-sm">
                  <p className="font-semibold">{patient.insurance.carrier} • {patient.insurance.planName}</p>
                  <p>Member ID: {patient.insurance.memberId}</p>
                  <p>Group: {patient.insurance.groupNumber}</p>
                  <p>Effective: {patient.insurance.effectiveDate}</p>
                  <p>Expiry: {patient.insurance.expiryDate}</p>
                  <p>Copay: ${patient.insurance.copay}</p>
                </div>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ${
                    patient.insurance.status === 'active'
                      ? 'bg-[#ecfdf3] text-[#15803d]'
                      : patient.insurance.status === 'pending_verification'
                      ? 'bg-[#fffbeb] text-[#b45309]'
                      : 'bg-[#fef2f2] text-[#b91c1c]'
                  }`}
                >
                  {patient.insurance.status.replace('_', ' ')}
                </span>
                <Button variant="ghost" className="mt-3 w-full">Verify Insurance</Button>

                {patient.insurance.secondary && (
                  <details className="mt-3 rounded-md border border-[#e8e8e4] p-2">
                    <summary className="cursor-pointer text-sm font-semibold">Secondary Insurance</summary>
                    <p className="mt-2 text-sm">{patient.insurance.secondary.carrier}</p>
                    <p className="text-sm">{patient.insurance.secondary.memberId}</p>
                  </details>
                )}
              </div>

              <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Alerts & Flags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.length === 0 && <span className="text-sm text-[#6b7280]">No active flags.</span>}
                  {chips.map((c) => (
                    <span key={c.label} className={`rounded-full px-2 py-1 text-xs font-bold ${c.cls}`}>{c.label}</span>
                  ))}
                </div>
              </div>
            </aside>

            <section className="space-y-4">
              <div className="flex flex-wrap gap-5 border-b border-[#e8e8e4]">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`pb-2 text-sm font-medium ${activeTab === t.key ? 'border-b-2 border-[#1a3c4d] text-[#1a3c4d]' : 'text-[#6b7280]'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Dental Chart</p>
                    <h3 className="text-2xl font-extrabold">Tooth Conditions</h3>
                    <div className="mt-3 overflow-auto rounded border border-[#e8e8e4] p-3">
                      <svg viewBox="0 0 900 220" className="h-[180px] w-full min-w-[780px]">
                        {Array.from({ length: 32 }).map((_, i) => {
                          const row = i < 16 ? 0 : 1
                          const col = i < 16 ? i : i - 16
                          const x = 30 + col * 52
                          const y = row === 0 ? 54 : 150
                          const conditions: ToothCondition[] = ['healthy', 'restoration', 'decay', 'healthy', 'missing', 'crown', 'root_canal', 'implant']
                          const c = conditions[(i + patient.id.length) % conditions.length]
                          const title = `Tooth #${i + 1} • ${c.replace('_', ' ')} • Last treatment ${patient.lastVisit?.date || 'N/A'}`
                          return (
                            <g key={i}>
                              <rect x={x} y={y} width={34} height={34} rx={8} className={toothStyles[c]}>
                                <title>{title}</title>
                              </rect>
                              <text x={x + 17} y={y + 52} textAnchor="middle" fontSize="10" fill="#6b7280">{i + 1}</text>
                              {c === 'missing' && <text x={x + 17} y={y + 22} textAnchor="middle" fontSize="14" fill="#6b7280">×</text>}
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Health Summary</p>
                      <div className="mt-2 grid gap-2 text-sm">
                        <p>Medical Alerts: <span className={patient.medicalAlerts.length ? 'text-red-600 font-semibold' : 'text-[#6b7280]'}>{patient.medicalAlerts.join(', ') || 'None'}</span></p>
                        <p>Current Medications: {patient.medications.join(', ') || 'None'}</p>
                        <p>Last X-Ray Date: {patient.documents.find((d) => d.type === 'X-Ray')?.uploadedAt || 'N/A'}</p>
                        <p>Periodontal Status: {patient.periodontalStatus}</p>
                        <p>Oral Hygiene Score: {patient.oralHygieneScore}</p>
                        <p>Smoking / Tobacco: {patient.smoking}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Recent Activity</p>
                      <div className="mt-2 space-y-2">
                        {patient.recentActivity.slice(0, 5).map((a) => (
                          <div key={a.id} className="rounded-md border border-[#e8e8e4] p-2 text-sm">
                            <p className="font-medium">{a.text}</p>
                            <p className="text-xs text-[#6b7280]">{a.date} • {a.type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Upcoming</p>
                    <div className="mt-2 grid gap-3">
                      {upcoming.length === 0 && <p className="text-sm text-[#6b7280]">No future appointments.</p>}
                      {upcoming.map((a) => (
                        <div key={a.id} className="rounded-lg border border-[#e8e8e4] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold">{a.date} • {a.provider}</p>
                              <p className="text-sm text-[#6b7280]">{a.procedure} • {a.operatory}</p>
                            </div>
                            <span className="rounded-full bg-[#f3f4f6] px-2 py-1 text-xs font-bold uppercase text-[#6b7280]">{a.status}</span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button variant="ghost">Reschedule</Button>
                            <Button variant="ghost">Cancel</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                    <div className="flex flex-wrap gap-2">
                      <select className="rounded-md border border-slate-300 p-2 text-sm" value={apptYearFilter} onChange={(e) => setApptYearFilter(e.target.value)}>
                        <option value="all">All Years</option>
                        {Array.from(new Set(past.map((a) => a.date.slice(0, 4)))).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <select className="rounded-md border border-slate-300 p-2 text-sm" value={apptProviderFilter} onChange={(e) => setApptProviderFilter(e.target.value)}>
                        <option value="all">All Providers</option>
                        {Array.from(new Set(past.map((a) => a.provider))).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <select className="rounded-md border border-slate-300 p-2 text-sm" value={apptStatusFilter} onChange={(e) => setApptStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        {Array.from(new Set(past.map((a) => a.status))).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-3 overflow-auto">
                      <table className="w-full min-w-[920px] text-sm">
                        <thead>
                          <tr className="h-12 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.15em] text-[#6b7280]">
                            <th>Date</th><th>Provider</th><th>Procedures</th><th>Duration</th><th>Status</th><th>Amount Charged</th><th>Amount Paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPast.map((a) => (
                            <Fragment key={a.id}>
                              <tr key={a.id} className="h-12 cursor-pointer border-b border-[#f0f0ec] hover:bg-[#f9f9f7]" onClick={() => setExpandedVisits((p) => ({ ...p, [a.id]: !p[a.id] }))}>
                                <td>{a.date}</td><td>{a.provider}</td><td>{a.procedure}</td><td>{a.durationMin}m</td><td>{a.status}</td><td>${a.charged.toFixed(2)}</td><td>${a.paid.toFixed(2)}</td>
                              </tr>
                              {expandedVisits[a.id] && (
                                <tr className="border-b border-[#f0f0ec] bg-[#fafaf8]">
                                  <td colSpan={7} className="p-3 text-[#6b7280]">Clinical Note Summary: {a.noteSummary}</td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'treatment' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button variant="ghost">Create New Treatment Plan</Button>
                  </div>
                  {patient.treatmentPlans.map((plan) => {
                    const completionPct = plan.totalEstimated ? Math.round((plan.amountCompleted / plan.totalEstimated) * 100) : 0
                    return (
                      <div key={plan.id} className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xl font-bold">{plan.name}</p>
                            <p className="text-sm text-[#6b7280]">{plan.createdDate} • {plan.provider}</p>
                          </div>
                          <span className="rounded-full bg-[#f3f4f6] px-2 py-1 text-xs font-bold uppercase text-[#6b7280]">{plan.status}</span>
                        </div>
                        <p className="mt-2 text-sm">Total: ${plan.totalEstimated.toFixed(2)} • Completed: ${plan.amountCompleted.toFixed(2)} • Remaining: ${(plan.totalEstimated - plan.amountCompleted).toFixed(2)}</p>
                        <div className="mt-2 h-2 rounded-full bg-[#eef0ef]"><div className="h-2 rounded-full bg-[#2a9d8f]" style={{ width: `${completionPct}%` }} /></div>
                        <button className="mt-2 text-sm text-[#1a3c4d] underline" onClick={() => setExpandedPlans((p) => ({ ...p, [plan.id]: !p[plan.id] }))}>{expandedPlans[plan.id] ? 'Hide items' : 'Expand items'}</button>
                        {expandedPlans[plan.id] && (
                          <div className="mt-3 overflow-auto">
                            <table className="w-full min-w-[760px] text-sm">
                              <thead>
                                <tr className="h-10 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.15em] text-[#6b7280]">
                                  <th>Tooth</th><th>Procedure</th><th>Priority</th><th>Status</th><th>Fee</th><th>Insurance Est.</th><th>Patient Est.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {plan.items.map((item) => (
                                  <tr key={item.id} className="h-11 border-b border-[#f0f0ec]">
                                    <td>{item.tooth}</td><td>{item.code} • {item.name}</td><td>{item.priority}</td>
                                    <td>
                                      <select className="rounded border border-slate-300 px-2 py-1 text-xs" defaultValue={item.status}>
                                        <option>Recommended</option>
                                        <option>Scheduled</option>
                                        <option>Completed</option>
                                      </select>
                                    </td>
                                    <td>${item.fee.toFixed(2)}</td><td>${item.insuranceEst.toFixed(2)}</td><td>${item.patientEst.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <select className="rounded-md border border-slate-300 p-2 text-sm" value={noteProviderFilter} onChange={(e) => setNoteProviderFilter(e.target.value)}>
                          <option value="all">All Providers</option>
                          {Array.from(new Set(patient.clinicalNotes.map((n) => n.provider))).map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <select className="rounded-md border border-slate-300 p-2 text-sm" value={noteFilterType} onChange={(e) => setNoteFilterType(e.target.value)}>
                          <option value="all">All Types</option>
                          {Array.from(new Set(patient.clinicalNotes.map((n) => n.type))).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <Input type="date" className="w-auto" value={noteDateFrom} onChange={(e) => setNoteDateFrom(e.target.value)} />
                        <Input type="date" className="w-auto" value={noteDateTo} onChange={(e) => setNoteDateTo(e.target.value)} />
                      </div>
                      <Button variant="ghost" onClick={() => setNewNoteOpen((o) => !o)}>Add Note</Button>
                    </div>

                    {newNoteOpen && (
                      <div className="mt-3 rounded-md border border-[#e8e8e4] p-3">
                        <div className="grid gap-2 md:grid-cols-2">
                          <Input placeholder="Note type" />
                          <Input placeholder="Provider" />
                          <Textarea placeholder="Subjective" />
                          <Textarea placeholder="Objective" />
                          <Textarea placeholder="Assessment" />
                          <Textarea placeholder="Plan" />
                        </div>
                        <Button className="mt-2">Save Note</Button>
                      </div>
                    )}
                  </div>

                  {filteredNotes.map((n) => (
                    <div key={n.id} className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{n.date} • {n.provider}</p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#eef0ef] px-2 py-1 text-xs font-bold uppercase text-[#1a3c4d]">{n.type}</span>
                          {role === 'provider' && <Button variant="ghost">Edit</Button>}
                        </div>
                      </div>
                      {([
                        ['S', n.subjective],
                        ['O', n.objective],
                        ['A', n.assessment],
                        ['P', n.plan],
                      ] as Array<[string, string]>).map(([k, text]) => {
                        const kId = `${n.id}-${k}`
                        return (
                          <div key={kId} className="mt-2 rounded-md border border-[#e8e8e4] p-2">
                            <button className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]" onClick={() => setExpandedNotes((p) => ({ ...p, [kId]: !p[kId] }))}>
                              {k} — {expandedNotes[kId] ? 'Collapse' : 'Expand'}
                            </button>
                            {expandedNotes[kId] && <p className="mt-1 text-sm">{text}</p>}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <select className="rounded-md border border-slate-300 p-2 text-sm" value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)}>
                      <option value="all">All Document Types</option>
                      {['X-Ray', 'Consent Form', 'Insurance Card', 'Lab Result', 'Photo', 'Other'].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <label className="inline-flex cursor-pointer rounded-md border border-[#e8e8e4] px-3 py-2 text-sm">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const idKey = `${file.name}-${Date.now()}`
                          setUploadProgress((p) => ({ ...p, [idKey]: 0 }))
                          let prog = 0
                          const t = setInterval(() => {
                            prog += 20
                            setUploadProgress((prev) => ({ ...prev, [idKey]: Math.min(100, prog) }))
                            if (prog >= 100) clearInterval(t)
                          }, 180)
                        }}
                      />
                    </label>
                  </div>

                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="rounded-md border border-[#e8e8e4] bg-white p-3">
                      {Object.entries(uploadProgress).map(([k, v]) => (
                        <div key={k} className="mb-2">
                          <p className="text-xs text-[#6b7280]">{k.split('-')[0]} • {v}%</p>
                          <div className="h-2 rounded-full bg-[#eef0ef]"><div className="h-2 rounded-full bg-[#2a9d8f]" style={{ width: `${v}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredDocs.map((d) => (
                      <div key={d.id} className="rounded-xl border border-[#e8e8e4] bg-white p-3">
                        <div className="h-24 rounded-md bg-[#f6f7f6]" />
                        <p className="mt-2 font-semibold">{d.name}</p>
                        <span className="rounded-full bg-[#eef0ef] px-2 py-1 text-xs font-bold uppercase text-[#6b7280]">{d.type}</span>
                        <p className="mt-1 text-xs text-[#6b7280]">{d.uploadedAt} • {d.uploadedBy}</p>
                        <div className="mt-2 flex gap-2">
                          <Button variant="ghost">Download</Button>
                          <Button variant="ghost">Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Total Charged: <strong>${patient.invoices.reduce((s, i) => s + i.totalFee, 0).toFixed(2)}</strong></span>
                    <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Insurance Paid: <strong>${patient.claims.filter((c) => c.status === 'Paid').reduce((s, c) => s + c.amountBilled, 0).toFixed(2)}</strong></span>
                    <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Patient Paid: <strong>${patient.payments.reduce((s, p) => s + p.amount, 0).toFixed(2)}</strong></span>
                    <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Outstanding: <strong>${patient.balance.toFixed(2)}</strong></span>
                  </div>

                  <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                    <h3 className="text-lg font-bold">Invoices</h3>
                    <div className="mt-2 overflow-auto">
                      <table className="w-full min-w-[920px] text-sm">
                        <thead>
                          <tr className="h-11 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">
                            <th>Date</th><th>Description</th><th>Total Fee</th><th>Insurance Est.</th><th>Patient Portion</th><th>Paid</th><th>Balance</th><th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.invoices.map((inv) => (
                            <Fragment key={inv.id}>
                              <tr key={inv.id} className="h-12 cursor-pointer border-b border-[#f0f0ec]" onClick={() => setExpandedInvoices((p) => ({ ...p, [inv.id]: !p[inv.id] }))}>
                                <td>{inv.date}</td><td>{inv.description}</td><td>${inv.totalFee.toFixed(2)}</td><td>${inv.insuranceEst.toFixed(2)}</td><td>${inv.patientPortion.toFixed(2)}</td><td>${inv.paid.toFixed(2)}</td><td>${inv.balance.toFixed(2)}</td>
                                <td>
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${
                                      inv.status === 'Paid'
                                        ? 'bg-[#ecfdf3] text-[#15803d]'
                                        : inv.status === 'Partial'
                                        ? 'bg-[#fffbeb] text-[#b45309]'
                                        : inv.status === 'Unpaid'
                                        ? 'bg-[#fef2f2] text-[#b91c1c]'
                                        : 'bg-[#f3f4f6] text-[#6b7280]'
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                              {expandedInvoices[inv.id] && (
                                <tr className="border-b border-[#f0f0ec] bg-[#fafaf8]">
                                  <td colSpan={8} className="p-3">
                                    {inv.lineItems.map((li, i) => (
                                      <p key={i} className="text-sm">{li.name} x{li.qty} — ${li.amount.toFixed(2)}</p>
                                    ))}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                    <h3 className="text-lg font-bold">Payments</h3>
                    <div className="mt-2 overflow-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead>
                          <tr className="h-11 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">
                            <th>Date</th><th>Amount</th><th>Method</th><th>Reference #</th><th>Recorded by</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.payments.map((pay) => (
                            <tr key={pay.id} className="h-11 border-b border-[#f0f0ec]">
                              <td>{pay.date}</td><td>${pay.amount.toFixed(2)}</td><td>{pay.method}</td><td>{pay.reference}</td><td>{pay.recordedBy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Insurance Claims</h3>
                      <Button variant="ghost">Record Payment</Button>
                    </div>
                    <div className="mt-2 overflow-auto">
                      <table className="w-full min-w-[860px] text-sm">
                        <thead>
                          <tr className="h-11 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">
                            <th>Claim #</th><th>Date</th><th>Procedure</th><th>Amount Billed</th><th>Insurance</th><th>Status</th><th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.claims.map((c) => (
                            <tr key={c.id} className="h-11 border-b border-[#f0f0ec]">
                              <td>{c.id}</td><td>{c.date}</td><td>{c.procedure}</td><td>${c.amountBilled.toFixed(2)}</td><td>{c.insurance}</td><td>{c.status}</td>
                              <td>{c.status === 'Denied' ? <Button variant="ghost">Resubmit</Button> : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <PatientDrawer open={openDrawer} onClose={() => setOpenDrawer(false)} mode="edit" initial={patient} onSave={setPatientPatch} />
      </AppLayout>
    </AuthGuard>
  )
}
