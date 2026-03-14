export type ProviderInfo = { id: string; name: string }
export type InsuranceStatus = 'active' | 'expired' | 'uninsured' | 'pending_verification'
export type PatientStatus = 'active' | 'inactive' | 'new'

export type PatientAppointment = {
  id: string
  date: string
  provider: string
  procedure: string
  operatory: string
  status: 'Scheduled' | 'Checked In' | 'In Chair' | 'Completed' | 'No Show' | 'Canceled'
  durationMin: number
  charged: number
  paid: number
  noteSummary: string
}

export type TreatmentPlanItem = {
  id: string
  tooth: string
  code: string
  name: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Recommended' | 'Scheduled' | 'Completed'
  fee: number
  insuranceEst: number
  patientEst: number
}

export type TreatmentPlan = {
  id: string
  name: string
  createdDate: string
  provider: string
  status: 'Draft' | 'Presented' | 'Accepted' | 'In Progress' | 'Completed' | 'Declined'
  totalEstimated: number
  amountCompleted: number
  items: TreatmentPlanItem[]
}

export type ClinicalNote = {
  id: string
  date: string
  provider: string
  type: 'Exam' | 'Cleaning' | 'Procedure' | 'Emergency' | 'Consultation'
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export type PatientDocument = {
  id: string
  name: string
  type: 'X-Ray' | 'Consent Form' | 'Insurance Card' | 'Lab Result' | 'Photo' | 'Other'
  uploadedAt: string
  uploadedBy: string
}

export type Invoice = {
  id: string
  date: string
  description: string
  totalFee: number
  insuranceEst: number
  patientPortion: number
  paid: number
  balance: number
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Void'
  lineItems: Array<{ name: string; qty: number; amount: number }>
}

export type Payment = {
  id: string
  date: string
  amount: number
  method: 'Cash' | 'Card' | 'Insurance' | 'Check'
  reference: string
  recordedBy: string
}

export type Claim = {
  id: string
  date: string
  procedure: string
  amountBilled: number
  insurance: string
  status: 'Pending' | 'Submitted' | 'Paid' | 'Denied'
}

export type PatientRecord = {
  id: string
  firstName: string
  lastName: string
  dob: string
  gender: 'Female' | 'Male' | 'Non-binary'
  phone: string
  email: string
  address: string
  preferredLanguage: string
  registrationDate: string
  emergencyContact: { name: string; relationship: string; phone: string }
  providerId: string
  providerName: string
  status: PatientStatus
  insurance: {
    carrier: string
    planName: string
    memberId: string
    groupNumber: string
    effectiveDate: string
    expiryDate: string
    copay: number
    status: InsuranceStatus
    secondary?: {
      carrier: string
      memberId: string
      groupNumber: string
      status: InsuranceStatus
    }
  }
  medicalAlerts: string[]
  medications: string[]
  periodontalStatus: 'Healthy' | 'Gingivitis' | 'Periodontitis'
  oralHygieneScore: 'Poor' | 'Fair' | 'Good' | 'Excellent'
  smoking: 'Never' | 'Former' | 'Current'
  specialNotes?: string
  balance: number
  lastVisit?: { date: string; procedure: string }
  nextAppointment?: { date: string; time: string; procedure: string }
  treatmentPlans: TreatmentPlan[]
  appointments: PatientAppointment[]
  clinicalNotes: ClinicalNote[]
  documents: PatientDocument[]
  invoices: Invoice[]
  payments: Payment[]
  claims: Claim[]
  recentActivity: Array<{ id: string; type: string; text: string; date: string }>
}

export const PROVIDERS: ProviderInfo[] = [
  { id: 'prov-1', name: 'Dr. Sarah Chen' },
  { id: 'prov-2', name: 'Dr. Marcus Webb' },
  { id: 'prov-3', name: 'Dr. Priya Patel' },
]

const FIRST_NAMES = [
  'Avery','Noah','Mia','Elijah','Sophia','Lucas','Olivia','Ethan','Emma','Liam','Ava','Mason','Isabella','James','Charlotte','Benjamin','Harper','Logan','Amelia','Jacob','Aria','Daniel','Leah','Mateo','Zara','Owen','Nora','Julian','Layla','Caleb','Anaya','Henry','Nina','Isaac','Mila','Theo','Ivy','Connor','Riya','Sebastian','Grace','Ryan','Saanvi','Adrian','Piper','Kabir','Maeve','Anika','Wyatt','Aisha',
]
const LAST_NAMES = [
  'Brooks','Garcia','Johnson','Davis','Patel','Turner','Reed','Price','Flores','Hayes','Kim','White','Ward','Cooper','Lopez','Ross','Gray','Hughes','Scott','Adams','Singh','Ramirez','Nguyen','Morris','Carter','Shah','Ali','Bennett','Khan','Evans',
]
const INSURERS = ['Delta Dental', 'BlueCross', 'Cigna', 'Aetna', 'Uninsured']
const PROCEDURES = ['Recall Exam', 'Crown Prep', 'Root Canal', 'Composite Filling', 'Implant Consult', 'Prophy Cleaning']
const LANGUAGES = ['English', 'Spanish', 'Hindi', 'Mandarin', 'Vietnamese']
const ADDRESSES = ['12 Pine St, Seattle, WA 98101', '490 3rd Ave, Bellevue, WA 98004', '221 Harbor Rd, Tacoma, WA 98402']

function rand(n: number) {
  const x = Math.sin(n * 912.93) * 10000
  return x - Math.floor(x)
}

function dateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function dateDaysAhead(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function ageFromDob(dob: string) {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1
  return age
}

export const AVATAR_COLORS = ['#d6e6e3', '#dce4ec', '#e4e9de', '#dddde8', '#e8ddd8', '#dbe8e2', '#e3e0d5', '#d8e1e8']
export function avatarColorFor(name: string) {
  const sum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

const basePatients: PatientRecord[] = Array.from({ length: 46 }).map((_, idx) => {
  const first = FIRST_NAMES[idx % FIRST_NAMES.length]
  const last = LAST_NAMES[(idx * 3) % LAST_NAMES.length]
  const fullName = `${first} ${last}`
  const id = `PT-${String(1000 + idx)}`
  const provider = PROVIDERS[idx % PROVIDERS.length]

  const ageSeed = 8 + Math.floor(rand(idx + 2) * 67)
  const birthDate = new Date()
  birthDate.setFullYear(birthDate.getFullYear() - ageSeed)
  birthDate.setMonth(Math.floor(rand(idx + 15) * 12), Math.floor(rand(idx + 20) * 27) + 1)

  const insurer = INSURERS[idx % INSURERS.length]
  const insuranceStatus: InsuranceStatus =
    insurer === 'Uninsured' ? 'uninsured' : rand(idx + 50) < 0.14 ? 'expired' : rand(idx + 51) < 0.22 ? 'pending_verification' : 'active'

  const regDays = 15 + Math.floor(rand(idx + 11) * 620)
  const hasNext = rand(idx + 80) > 0.34
  const balance = rand(idx + 90) < 0.38 ? Math.round((90 + rand(idx + 91) * 980) * 100) / 100 : 0

  const status: PatientStatus = regDays < 45 ? 'new' : rand(idx + 66) < 0.08 ? 'inactive' : 'active'

  const medicalAlerts: string[] = []
  if (idx % 13 === 0) medicalAlerts.push('Penicillin allergy')
  if (idx % 17 === 0) medicalAlerts.push('Blood thinner')
  if (idx % 19 === 0) medicalAlerts.push('Diabetic')

  const appointments: PatientAppointment[] = Array.from({ length: 2 + (idx % 7) }).map((__, aIdx) => {
    const pastDays = 25 + aIdx * 41 + (idx % 14)
    const date = dateDaysAgo(pastDays)
    const statusOptions: PatientAppointment['status'][] = ['Completed', 'Completed', 'Completed', 'No Show', 'Completed', 'Completed']
    const status = statusOptions[(idx + aIdx) % statusOptions.length]
    const charge = Math.round((180 + rand(idx * 11 + aIdx) * 520) * 100) / 100
    const paid = status === 'Completed' ? Math.round(charge * (0.75 + rand(idx + aIdx + 5) * 0.2) * 100) / 100 : 0
    return {
      id: `${id}-appt-${aIdx}`,
      date,
      provider: provider.name,
      procedure: PROCEDURES[(idx + aIdx) % PROCEDURES.length],
      operatory: `Operatory ${1 + ((idx + aIdx) % 6)}`,
      status,
      durationMin: 30 + ((idx + aIdx) % 4) * 15,
      charged: charge,
      paid,
      noteSummary: status === 'No Show' ? 'No clinical note — patient did not arrive.' : 'Patient tolerated treatment well. Next recall in 6 months.',
    }
  })

  const futureAppointments: PatientAppointment[] = hasNext
    ? [
        {
          id: `${id}-future-0`,
          date: dateDaysAhead(2 + (idx % 35)),
          provider: provider.name,
          procedure: PROCEDURES[(idx + 2) % PROCEDURES.length],
          operatory: `Operatory ${1 + (idx % 6)}`,
          status: 'Scheduled',
          durationMin: 45,
          charged: 0,
          paid: 0,
          noteSummary: 'Upcoming visit.',
        },
      ]
    : []

  const allAppointments = [...appointments, ...futureAppointments].sort((a, b) => (a.date < b.date ? 1 : -1))

  const planItems: TreatmentPlanItem[] = Array.from({ length: 3 + (idx % 3) }).map((__, i) => {
    const fee = Math.round((160 + rand(idx + i * 3) * 760) * 100) / 100
    const insuranceEst = insurer === 'Uninsured' ? 0 : Math.round(fee * (0.45 + rand(idx + i + 7) * 0.25) * 100) / 100
    return {
      id: `${id}-item-${i}`,
      tooth: String(2 + ((idx + i * 2) % 30)),
      code: `D${2000 + ((idx + i * 7) % 500)}`,
      name: PROCEDURES[(idx + i) % PROCEDURES.length],
      priority: i === 0 ? 'High' : i === 1 ? 'Medium' : 'Low',
      status: i === 0 ? 'Scheduled' : i % 2 === 0 ? 'Recommended' : 'Completed',
      fee,
      insuranceEst,
      patientEst: Math.max(0, Math.round((fee - insuranceEst) * 100) / 100),
    }
  })

  const totalEstimated = planItems.reduce((s, p) => s + p.fee, 0)
  const amountCompleted = planItems.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.fee, 0)

  const clinicalNotes: ClinicalNote[] = Array.from({ length: 1 + (idx % 3) }).map((__, nIdx) => ({
    id: `${id}-note-${nIdx}`,
    date: dateDaysAgo(18 + nIdx * 90 + (idx % 9)),
    provider: provider.name,
    type: (['Exam', 'Cleaning', 'Procedure', 'Consultation'] as ClinicalNote['type'][])[(idx + nIdx) % 4],
    subjective: 'Patient reports intermittent sensitivity to cold on upper right quadrant.',
    objective: 'Class II carious lesion noted on tooth #14 with mild gingival inflammation.',
    assessment: 'Localized caries with early gingivitis. No pulpal involvement at this time.',
    plan: 'Recommend composite restoration and prophylaxis. Re-evaluate in 4-6 weeks.',
  }))

  const invoices: Invoice[] = appointments.slice(0, 4).map((a, i) => {
    const patientPortion = Math.max(0, a.charged * 0.35)
    const paid = i % 3 === 0 ? a.charged : i % 3 === 1 ? a.charged * 0.6 : 0
    const balanceInv = Math.max(0, a.charged - paid)
    const statusInv: Invoice['status'] = balanceInv === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'
    return {
      id: `${id}-inv-${i}`,
      date: a.date,
      description: a.procedure,
      totalFee: Math.round(a.charged * 100) / 100,
      insuranceEst: Math.round((a.charged - patientPortion) * 100) / 100,
      patientPortion: Math.round(patientPortion * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      balance: Math.round(balanceInv * 100) / 100,
      status: statusInv,
      lineItems: [
        { name: a.procedure, qty: 1, amount: Math.round(a.charged * 100) / 100 },
        { name: 'Operatory Fee', qty: 1, amount: 45 },
      ],
    }
  })

  const payments: Payment[] = invoices
    .filter((i) => i.paid > 0)
    .map((i, pIdx) => ({
      id: `${id}-pay-${pIdx}`,
      date: i.date,
      amount: i.paid,
      method: (['Card', 'Insurance', 'Cash'] as Payment['method'][])[(idx + pIdx) % 3],
      reference: `PMT-${idx}${pIdx}${120 + pIdx}`,
      recordedBy: ['Front Desk', 'Billing', 'Office Manager'][(idx + pIdx) % 3],
    }))

  const claims: Claim[] = invoices.slice(0, 3).map((inv, cIdx) => ({
    id: `CLM-${idx}${cIdx}${600 + cIdx}`,
    date: inv.date,
    procedure: inv.description,
    amountBilled: inv.totalFee,
    insurance: insurer,
    status: (['Paid', 'Pending', 'Submitted', 'Denied'] as Claim['status'][])[(idx + cIdx) % 4],
  }))

  const recentActivity = [
    { id: `${id}-a1`, type: 'appointment', text: 'Appointment completed', date: appointments[0]?.date || dateDaysAgo(7) },
    { id: `${id}-a2`, type: 'payment', text: 'Payment posted to account', date: invoices[0]?.date || dateDaysAgo(14) },
    { id: `${id}-a3`, type: 'message', text: 'SMS reminder sent', date: dateDaysAgo(3) },
    { id: `${id}-a4`, type: 'document', text: 'Insurance card uploaded', date: dateDaysAgo(22) },
    { id: `${id}-a5`, type: 'treatment', text: 'Treatment plan presented', date: dateDaysAgo(46) },
  ]

  const lastVisitAppt = appointments[0]
  const nextAppt = futureAppointments[0]

  return {
    id,
    firstName: first,
    lastName: last,
    dob: birthDate.toISOString().slice(0, 10),
    gender: (['Female', 'Male', 'Non-binary'] as const)[idx % 3],
    phone: `(${200 + (idx % 700)}) 55${idx % 10}${(idx * 3) % 10}-1${(idx * 7) % 10}${(idx * 9) % 10}${(idx * 11) % 10}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    address: ADDRESSES[idx % ADDRESSES.length],
    preferredLanguage: LANGUAGES[idx % LANGUAGES.length],
    registrationDate: dateDaysAgo(regDays),
    emergencyContact: {
      name: `${FIRST_NAMES[(idx + 7) % FIRST_NAMES.length]} ${last}`,
      relationship: ['Spouse', 'Parent', 'Sibling', 'Friend'][idx % 4],
      phone: `(${300 + (idx % 600)}) 77${idx % 10}${(idx * 5) % 10}-4${(idx * 8) % 10}${(idx * 2) % 10}${(idx * 4) % 10}`,
    },
    providerId: provider.id,
    providerName: provider.name,
    status,
    insurance: {
      carrier: insurer,
      planName: insurer === 'Uninsured' ? 'None' : `${insurer} PPO`,
      memberId: insurer === 'Uninsured' ? '-' : `MBR${100000 + idx}`,
      groupNumber: insurer === 'Uninsured' ? '-' : `GRP-${2000 + idx}`,
      effectiveDate: dateDaysAgo(365 + (idx % 200)),
      expiryDate: insurer === 'Uninsured' ? dateDaysAgo(1) : dateDaysAhead(20 + (idx % 540)),
      copay: insurer === 'Uninsured' ? 0 : 20 + (idx % 4) * 10,
      status: insuranceStatus,
      secondary: idx % 6 === 0 ? { carrier: 'Aetna', memberId: `S${90000 + idx}`, groupNumber: `SG-${idx}`, status: 'active' } : undefined,
    },
    medicalAlerts,
    medications: idx % 5 === 0 ? ['Lisinopril', 'Metformin'] : idx % 4 === 0 ? ['Atorvastatin'] : [],
    periodontalStatus: (['Healthy', 'Gingivitis', 'Periodontitis'] as const)[idx % 3],
    oralHygieneScore: (['Poor', 'Fair', 'Good', 'Excellent'] as const)[idx % 4],
    smoking: (['Never', 'Former', 'Current'] as const)[idx % 3],
    specialNotes: idx % 9 === 0 ? 'VIP / requests early morning appointments.' : undefined,
    balance,
    lastVisit: lastVisitAppt ? { date: lastVisitAppt.date, procedure: lastVisitAppt.procedure } : undefined,
    nextAppointment: nextAppt ? { date: nextAppt.date, time: '09:30 AM', procedure: nextAppt.procedure } : undefined,
    treatmentPlans: [
      {
        id: `${id}-plan-1`,
        name: 'Comprehensive Restorative Plan',
        createdDate: dateDaysAgo(60 + (idx % 80)),
        provider: provider.name,
        status: (['Draft', 'Presented', 'Accepted', 'In Progress', 'Completed', 'Declined'] as TreatmentPlan['status'][])[idx % 6],
        totalEstimated,
        amountCompleted,
        items: planItems,
      },
    ],
    appointments: allAppointments,
    clinicalNotes,
    documents: [
      { id: `${id}-doc-1`, name: 'Bitewing X-Ray', type: 'X-Ray', uploadedAt: dateDaysAgo(90), uploadedBy: provider.name },
      { id: `${id}-doc-2`, name: 'Treatment Consent', type: 'Consent Form', uploadedAt: dateDaysAgo(110), uploadedBy: 'Front Desk' },
      { id: `${id}-doc-3`, name: 'Insurance Card Front', type: 'Insurance Card', uploadedAt: dateDaysAgo(130), uploadedBy: 'Front Desk' },
    ],
    invoices,
    payments,
    claims,
    recentActivity,
  }
})

export const PATIENTS_MOCK = basePatients

export function fullName(p: Pick<PatientRecord, 'firstName' | 'lastName'>) {
  return `${p.firstName} ${p.lastName}`
}

export function initialsOf(name: string) {
  const parts = name.split(' ')
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

export function ageOf(dob: string) {
  return ageFromDob(dob)
}
