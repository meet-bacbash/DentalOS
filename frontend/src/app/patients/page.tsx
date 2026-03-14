'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '../../components/AuthGuard'
import AppLayout from '../../layouts/AppLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import PatientDrawer from '../../components/patients/PatientDrawer'
import { PATIENTS_MOCK, PROVIDERS, PatientRecord, ageOf, avatarColorFor, fullName, initialsOf } from '../../lib/patientsMock'
import { useAuthContext } from '../../components/AuthContext'

type LastVisitFilter = 'all' | 'month' | '3m' | '6m' | 'never'
type SortKey = 'name' | 'lastVisit' | 'nextAppointment' | 'balance'

const pageSize = 10

function daysSince(date?: string) {
  if (!date) return Number.POSITIVE_INFINITY
  const d = new Date(date)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24))
}

export default function PatientsPage() {
  const router = useRouter()
  const { role, providerName } = useAuthContext()

  const [patients, setPatients] = useState<PatientRecord[]>(PATIENTS_MOCK)
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [insuranceFilter, setInsuranceFilter] = useState('all')
  const [lastVisitFilter, setLastVisitFilter] = useState<LastVisitFilter>('all')
  const [balanceOnly, setBalanceOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const scopedPatients = useMemo(() => {
    if (role !== 'provider' || !providerName) return patients
    return patients.filter((p) => p.providerName === providerName)
  }, [patients, role, providerName])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    let rows = scopedPatients.filter((p) => {
      if (
        q &&
        !(
          fullName(p).toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        )
      ) {
        return false
      }

      if (providerFilter !== 'all' && p.providerId !== providerFilter) return false
      if (insuranceFilter !== 'all' && p.insurance.status !== insuranceFilter) return false

      const sinceVisit = daysSince(p.lastVisit?.date)
      if (lastVisitFilter === 'month' && sinceVisit > 31) return false
      if (lastVisitFilter === '3m' && (sinceVisit > 92 || sinceVisit <= 31)) return false
      if (lastVisitFilter === '6m' && sinceVisit <= 180) return false
      if (lastVisitFilter === 'never' && p.lastVisit) return false

      if (balanceOnly && p.balance <= 0) return false

      return true
    })

    rows = [...rows].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name') return fullName(a).localeCompare(fullName(b)) * mul
      if (sortKey === 'balance') return (a.balance - b.balance) * mul
      if (sortKey === 'lastVisit') return (daysSince(a.lastVisit?.date) - daysSince(b.lastVisit?.date)) * -mul
      if (sortKey === 'nextAppointment') {
        const x = a.nextAppointment?.date ? new Date(a.nextAppointment.date).getTime() : Number.POSITIVE_INFINITY
        const y = b.nextAppointment?.date ? new Date(b.nextAppointment.date).getTime() : Number.POSITIVE_INFINITY
        return (x - y) * mul
      }
      return 0
    })

    return rows
  }, [balanceOnly, insuranceFilter, lastVisitFilter, providerFilter, scopedPatients, search, sortDir, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const quickStats = useMemo(() => {
    const total = scopedPatients.length
    const activeThisMonth = scopedPatients.filter((p) => daysSince(p.lastVisit?.date) <= 31).length
    const newThisMonth = scopedPatients.filter((p) => daysSince(p.registrationDate) <= 31).length
    const withBalance = scopedPatients.filter((p) => p.balance > 0).length
    return { total, activeThisMonth, newThisMonth, withBalance }
  }, [scopedPatients])

  const hasFilters = search || providerFilter !== 'all' || insuranceFilter !== 'all' || lastVisitFilter !== 'all' || balanceOnly

  const resetFilters = () => {
    setSearch('')
    setProviderFilter('all')
    setInsuranceFilter('all')
    setLastVisitFilter('all')
    setBalanceOnly(false)
    setPage(1)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const addPatient = (payload: Partial<PatientRecord>) => {
    const next: PatientRecord = {
      ...PATIENTS_MOCK[0],
      ...payload,
      id: `PT-${Math.floor(1000 + Math.random() * 8999)}`,
      registrationDate: new Date().toISOString().slice(0, 10),
      status: 'new',
      balance: 0,
      lastVisit: undefined,
      nextAppointment: undefined,
      treatmentPlans: [],
      appointments: [],
      clinicalNotes: [],
      documents: [],
      invoices: [],
      payments: [],
      claims: [],
      recentActivity: [],
      firstName: payload.firstName || 'New',
      lastName: payload.lastName || 'Patient',
      phone: payload.phone || '(000) 000-0000',
      email: payload.email || 'new.patient@example.com',
      dob: payload.dob || '1990-01-01',
      gender: payload.gender || 'Female',
      providerId: payload.providerId || PROVIDERS[0].id,
      providerName: payload.providerName || PROVIDERS[0].name,
      insurance: payload.insurance || PATIENTS_MOCK[0].insurance,
      emergencyContact: payload.emergencyContact || PATIENTS_MOCK[0].emergencyContact,
      medications: payload.medications || [],
      medicalAlerts: payload.medicalAlerts || [],
      periodontalStatus: 'Healthy',
      oralHygieneScore: 'Good',
      smoking: 'Never',
      preferredLanguage: payload.preferredLanguage || 'English',
      address: payload.address || 'Address not set',
    }
    setPatients((prev) => [next, ...prev])
  }

  const topRight = (
    <Button variant="ghost" className="border-[#1a3c4d] text-[#1a3c4d]" onClick={() => setDrawerOpen(true)}>
      Add Patient
    </Button>
  )

  return (
    <AuthGuard>
      <AppLayout sectionLabel="PATIENT MANAGEMENT" title="Patients" rightSlot={topRight}>
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e8e8e4] bg-white p-4">
            <div className="grid gap-3 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Search by name, phone, email, patient ID"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <select className="rounded-md border border-slate-300 p-2 text-sm" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
                <option value="all">All Providers</option>
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select className="rounded-md border border-slate-300 p-2 text-sm" value={insuranceFilter} onChange={(e) => setInsuranceFilter(e.target.value)}>
                <option value="all">All Insurance</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="uninsured">Uninsured</option>
                <option value="pending_verification">Pending Verification</option>
              </select>

              <select className="rounded-md border border-slate-300 p-2 text-sm" value={lastVisitFilter} onChange={(e) => setLastVisitFilter(e.target.value as LastVisitFilter)}>
                <option value="all">All Last Visits</option>
                <option value="month">This Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">6+ Months Ago</option>
                <option value="never">Never</option>
              </select>

              <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 text-sm">
                <input type="checkbox" checked={balanceOnly} onChange={(e) => setBalanceOnly(e.target.checked)} />
                Has Outstanding Balance
              </label>
            </div>
            {hasFilters && (
              <button className="mt-2 text-sm text-[#1a3c4d] underline" onClick={resetFilters}>
                Clear All Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Total Patients: <strong>{quickStats.total}</strong></span>
            <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Active This Month: <strong>{quickStats.activeThisMonth}</strong></span>
            <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">New This Month: <strong>{quickStats.newThisMonth}</strong></span>
            <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Outstanding Balance: <strong>{quickStats.withBalance}</strong></span>
          </div>

          <div className="overflow-auto rounded-xl border border-[#e8e8e4] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <table className="min-w-[1200px] w-full border-collapse text-sm">
              <thead className="bg-[#fafaf8] text-left">
                <tr className="h-12 border-b border-[#e8e8e4]">
                  <th className="px-4">Patient</th>
                  <th className="cursor-pointer px-4 text-[11px] uppercase tracking-[0.18em] text-[#6b7280]" onClick={() => toggleSort('name')}>Name</th>
                  <th className="px-4">Date of Birth + Age</th>
                  <th className="px-4">Phone</th>
                  <th className="px-4">Primary Insurance</th>
                  <th className="cursor-pointer px-4" onClick={() => toggleSort('lastVisit')}>Last Visit</th>
                  <th className="cursor-pointer px-4" onClick={() => toggleSort('nextAppointment')}>Next Appointment</th>
                  <th className="cursor-pointer px-4" onClick={() => toggleSort('balance')}>Balance</th>
                  <th className="px-4">Status</th>
                  <th className="px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => {
                  const name = fullName(p)
                  return (
                    <tr
                      key={p.id}
                      className="h-12 cursor-pointer border-b border-[#f0f0ec] hover:bg-[#f9f9f7]"
                      onClick={() => router.push(`/patients/${p.id}`)}
                    >
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={{ background: avatarColorFor(name) }}>
                            {initialsOf(name)}
                          </span>
                          <div>
                            <p className="font-semibold text-[#1a1a1a]">{name}</p>
                            <p className="text-xs text-[#6b7280]">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4">{name}</td>
                      <td className="px-4">{p.dob} • {ageOf(p.dob)}y</td>
                      <td className="px-4">{p.phone}</td>
                      <td className="px-4">
                        <p>{p.insurance.carrier}</p>
                        <p className="text-xs text-[#6b7280]">{p.insurance.memberId}</p>
                      </td>
                      <td className="px-4">
                        {p.lastVisit ? (
                          <>
                            <p>{p.lastVisit.date}</p>
                            <p className="text-xs text-[#6b7280]">{p.lastVisit.procedure}</p>
                          </>
                        ) : (
                          <span className="text-[#6b7280]">Never</span>
                        )}
                      </td>
                      <td className="px-4">
                        {p.nextAppointment ? (
                          <>
                            <p>{p.nextAppointment.date}</p>
                            <p className="text-xs text-[#6b7280]">{p.nextAppointment.time}</p>
                          </>
                        ) : (
                          <span className="text-[#6b7280]">Not Scheduled</span>
                        )}
                      </td>
                      <td className="px-4 font-semibold">
                        {p.balance > 0 ? <span className="text-red-600">${p.balance.toFixed(2)}</span> : <span className="text-green-700">Paid</span>}
                      </td>
                      <td className="px-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${
                            p.status === 'active'
                              ? 'bg-[#ecfdf3] text-[#15803d]'
                              : p.status === 'new'
                              ? 'bg-[#fffbeb] text-[#b45309]'
                              : 'bg-[#f3f4f6] text-[#6b7280]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4">
                        <details onClick={(e) => e.stopPropagation()}>
                          <summary className="cursor-pointer list-none text-lg">⋯</summary>
                          <div className="absolute z-20 mt-1 w-44 rounded-md border border-[#e8e8e4] bg-white p-1 shadow">
                            <button className="block w-full rounded px-2 py-1 text-left hover:bg-[#f9f9f7]" onClick={() => router.push(`/patients/${p.id}`)}>View Profile</button>
                            <button className="block w-full rounded px-2 py-1 text-left hover:bg-[#f9f9f7]" onClick={() => router.push('/appointments')}>Schedule Appointment</button>
                            <button className="block w-full rounded px-2 py-1 text-left hover:bg-[#f9f9f7]">Send Reminder</button>
                            <button className="block w-full rounded px-2 py-1 text-left hover:bg-[#f9f9f7]">Mark Inactive</button>
                          </div>
                        </details>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <p>
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} patients
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="ghost" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </div>
        </div>

        <PatientDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} mode="add" onSave={addPatient} />
      </AppLayout>
    </AuthGuard>
  )
}
