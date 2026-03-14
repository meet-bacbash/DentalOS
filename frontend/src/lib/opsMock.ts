export type ProviderName = 'Dr. Sarah Chen' | 'Dr. Marcus Webb' | 'Dr. Priya Patel'

export const PROVIDERS: Array<{ id: string; name: ProviderName; color: string }> = [
  { id: 'prov-1', name: 'Dr. Sarah Chen', color: '#b8d7d3' },
  { id: 'prov-2', name: 'Dr. Marcus Webb', color: '#cad8e6' },
  { id: 'prov-3', name: 'Dr. Priya Patel', color: '#d9ddc8' },
]

export const PATIENT_NAMES = [
  'Avery Brooks', 'Noah Garcia', 'Mia Johnson', 'Elijah Davis', 'Sophia Patel', 'Lucas Turner', 'Olivia Reed', 'Ethan Price',
  'Emma Flores', 'Liam Hayes', 'Ava Kim', 'Mason White', 'Isabella Ward', 'James Cooper', 'Charlotte Lopez', 'Benjamin Ross',
  'Harper Gray', 'Logan Hughes', 'Amelia Scott', 'Jacob Adams',
]

export const PROCEDURES = ['Cleaning', 'Filling', 'Crown', 'Root Canal', 'Exam', 'Extraction'] as const
export type ProcedureType = (typeof PROCEDURES)[number]

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Checked In' | 'In Chair' | 'Completed' | 'No Show' | 'Cancelled'

export type Appointment = {
  id: string
  patientName: string
  patientId: string
  provider: ProviderName
  procedure: ProcedureType
  durationMin: number
  operatory: string
  status: AppointmentStatus
  startAt: string
  reminderPreference: 'SMS' | 'Email' | 'Both' | 'None'
  notes?: string
  outstandingBalance: number
  lastVisitDate: string
}

export type ClinicalNoteType = 'Exam' | 'Cleaning' | 'Procedure' | 'Emergency' | 'Consultation'

export type ClinicalNote = {
  id: string
  date: string
  patientName: string
  patientId: string
  provider: ProviderName
  type: ClinicalNoteType
  subjective: string
  objective: string
  assessment: string
  plan: string
  linkedAppointmentId?: string
  completedProcedures: string[]
}

export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue'

export type Invoice = {
  id: string
  date: string
  patientName: string
  patientId: string
  provider: ProviderName
  procedures: string[]
  totalFee: number
  insuranceEst: number
  patientPortion: number
  paid: number
  balance: number
  status: InvoiceStatus
  carrier: string
  lineItems: Array<{ code: string; name: string; fee: number }>
}

export type ClaimStatus = 'Pending' | 'Submitted' | 'Paid' | 'Denied' | 'Overdue'
export type Claim = {
  id: string
  submittedDate: string
  patientName: string
  patientId: string
  carrier: string
  procedures: string[]
  amountBilled: number
  amountPaid: number
  status: ClaimStatus
}

function seeded(n: number) {
  const x = Math.sin(n * 997.23) * 10000
  return x - Math.floor(x)
}

function addDays(base: Date, d: number) {
  const x = new Date(base)
  x.setDate(x.getDate() + d)
  return x
}

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10)
}

function toIsoAt(d: Date, hh: number, mm: number) {
  const x = new Date(d)
  x.setHours(hh, mm, 0, 0)
  return x.toISOString()
}

const carriers = ['Delta Dental', 'BlueCross', 'Cigna', 'Aetna']

export function makeAppointmentsMock(): Appointment[] {
  const today = new Date()
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay()
  const weekStart = addDays(today, mondayOffset)

  const list: Appointment[] = []
  for (let i = 0; i < 19; i += 1) {
    const provider = PROVIDERS[i % 3]
    const day = addDays(weekStart, i % 7)
    const hh = 8 + ((i * 3) % 10)
    const mm = i % 2 === 0 ? 0 : 30
    const procedure = PROCEDURES[i % PROCEDURES.length]
    const statusOrder: AppointmentStatus[] = ['Scheduled', 'Confirmed', 'Checked In', 'In Chair', 'Completed', 'No Show', 'Cancelled']
    const status = statusOrder[i % statusOrder.length]
    list.push({
      id: `APT-${1000 + i}`,
      patientName: PATIENT_NAMES[i % PATIENT_NAMES.length],
      patientId: `PT-${1000 + (i % PATIENT_NAMES.length)}`,
      provider: provider.name,
      procedure,
      durationMin: procedure === 'Exam' ? 30 : procedure === 'Cleaning' ? 45 : 60,
      operatory: `Chair ${1 + (i % 6)}`,
      status,
      startAt: toIsoAt(day, hh, mm),
      reminderPreference: (['SMS', 'Email', 'Both', 'None'] as const)[i % 4],
      notes: i % 4 === 0 ? 'Patient requested morning slot.' : '',
      outstandingBalance: i % 5 === 0 ? Math.round((70 + seeded(i) * 500) * 100) / 100 : 0,
      lastVisitDate: toDateOnly(addDays(day, -40 - (i % 60))),
    })
  }
  return list
}

export function makeClinicalNotesMock(appointments: Appointment[]): ClinicalNote[] {
  const notes: ClinicalNote[] = []
  for (let i = 0; i < 26; i += 1) {
    const appt = appointments[i % appointments.length]
    const date = toDateOnly(addDays(new Date(), -6 - i * 3))
    const type: ClinicalNoteType = (['Exam', 'Cleaning', 'Procedure', 'Emergency', 'Consultation'] as const)[i % 5]
    notes.push({
      id: `NOTE-${2000 + i}`,
      date,
      patientName: appt.patientName,
      patientId: appt.patientId,
      provider: appt.provider,
      type,
      subjective: 'Patient reports intermittent sensitivity and discomfort when chewing on the right side.',
      objective: 'Clinical exam shows localized caries with mild gingival inflammation and no acute swelling.',
      assessment: 'Likely early dentinal caries with reversible pulpitis. Periodontal condition stable.',
      plan: 'Performed indicated procedure, reinforced oral hygiene, and scheduled follow-up in 4-6 weeks.',
      linkedAppointmentId: appt.id,
      completedProcedures: [appt.procedure],
    })
  }
  return notes
}

export function makeInvoicesMock(appointments: Appointment[]): Invoice[] {
  const invoices: Invoice[] = []
  for (let i = 0; i < 36; i += 1) {
    const appt = appointments[i % appointments.length]
    const total = Math.round((220 + seeded(i + 2) * 820) * 100) / 100
    const insuranceEst = Math.round(total * (0.45 + seeded(i + 5) * 0.25) * 100) / 100
    const patientPortion = Math.round((total - insuranceEst) * 100) / 100
    const paid = i % 5 === 0 ? total : i % 5 === 1 ? Math.round(total * 0.65 * 100) / 100 : i % 7 === 0 ? Math.round(total * 0.2 * 100) / 100 : 0
    const balance = Math.round((total - paid) * 100) / 100
    const ageDays = 4 + i * 2
    const date = toDateOnly(addDays(new Date(), -ageDays))

    let status: InvoiceStatus = balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'
    if (balance > 0 && ageDays > 35) status = 'Overdue'

    invoices.push({
      id: `INV-${4000 + i}`,
      date,
      patientName: appt.patientName,
      patientId: appt.patientId,
      provider: appt.provider,
      procedures: [appt.procedure],
      totalFee: total,
      insuranceEst,
      patientPortion,
      paid,
      balance,
      status,
      carrier: carriers[i % carriers.length],
      lineItems: [
        { code: `D${2200 + (i % 300)}`, name: appt.procedure, fee: Math.round(total * 0.8 * 100) / 100 },
        { code: 'OF-01', name: 'Operatory Fee', fee: Math.round(total * 0.2 * 100) / 100 },
      ],
    })
  }
  return invoices
}

export function makeClaimsMock(invoices: Invoice[]): Claim[] {
  const claims: Claim[] = []
  for (let i = 0; i < 24; i += 1) {
    const inv = invoices[i]
    const status: ClaimStatus = (['Pending', 'Submitted', 'Paid', 'Denied', 'Overdue'] as const)[i % 5]
    claims.push({
      id: `CLM-${7000 + i}`,
      submittedDate: inv.date,
      patientName: inv.patientName,
      patientId: inv.patientId,
      carrier: inv.carrier,
      procedures: inv.procedures,
      amountBilled: inv.totalFee,
      amountPaid: status === 'Paid' ? Math.round(inv.totalFee * 0.9 * 100) / 100 : 0,
      status,
    })
  }
  return claims
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const AVATAR_COLORS = ['#d6e6e3', '#dce4ec', '#e4e9de', '#dddde8', '#e8ddd8', '#dbe8e2', '#e3e0d5', '#d8e1e8']
export function avatarColor(name: string) {
  const sum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export function formatMoney(v: number) {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
