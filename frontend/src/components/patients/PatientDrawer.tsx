'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { PATIENTS_MOCK, PROVIDERS, PatientRecord } from '../../lib/patientsMock'

type Props = {
  open: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  initial?: PatientRecord | null
  onSave?: (payload: Partial<PatientRecord>) => void
}

type FormState = {
  firstName: string
  lastName: string
  dob: string
  gender: string
  preferredLanguage: string
  phone: string
  email: string
  address: string
  emergencyName: string
  emergencyRelationship: string
  emergencyPhone: string
  allergies: string
  medications: string
  conditions: string[]
  conditionOther: string
  carrier: string
  memberId: string
  groupNumber: string
  effectiveDate: string
  expiryDate: string
  secondaryEnabled: boolean
  secondaryCarrier: string
  secondaryMemberId: string
  secondaryGroup: string
  preferredProvider: string
  preferredTime: string
  reminderPreference: string
  specialNotes: string
}

function formFromPatient(patient?: PatientRecord | null): FormState {
  return {
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    dob: patient?.dob || '',
    gender: patient?.gender || '',
    preferredLanguage: patient?.preferredLanguage || 'English',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
    emergencyName: patient?.emergencyContact.name || '',
    emergencyRelationship: patient?.emergencyContact.relationship || '',
    emergencyPhone: patient?.emergencyContact.phone || '',
    allergies: patient?.medicalAlerts.join(', ') || '',
    medications: patient?.medications.join(', ') || '',
    conditions: [],
    conditionOther: '',
    carrier: patient?.insurance.carrier === 'Uninsured' ? '' : patient?.insurance.carrier || '',
    memberId: patient?.insurance.memberId === '-' ? '' : patient?.insurance.memberId || '',
    groupNumber: patient?.insurance.groupNumber === '-' ? '' : patient?.insurance.groupNumber || '',
    effectiveDate: patient?.insurance.effectiveDate || '',
    expiryDate: patient?.insurance.expiryDate || '',
    secondaryEnabled: Boolean(patient?.insurance.secondary),
    secondaryCarrier: patient?.insurance.secondary?.carrier || '',
    secondaryMemberId: patient?.insurance.secondary?.memberId || '',
    secondaryGroup: patient?.insurance.secondary?.groupNumber || '',
    preferredProvider: patient?.providerId || PROVIDERS[0].id,
    preferredTime: 'Morning',
    reminderPreference: 'Both',
    specialNotes: patient?.specialNotes || '',
  }
}

export default function PatientDrawer({ open, onClose, mode, initial, onSave }: Props) {
  const [form, setForm] = useState<FormState>(() => formFromPatient(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(formFromPatient(initial)), [form, initial])

  if (!open) return null

  const closeWithGuard = () => {
    if (dirty && !window.confirm('You have unsaved changes. Discard changes?')) {
      return
    }
    onClose()
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.firstName.trim()) next.firstName = 'First name is required.'
    if (!form.lastName.trim()) next.lastName = 'Last name is required.'
    if (!form.dob) next.dob = 'DOB is required.'
    if (!form.phone.trim()) next.phone = 'Phone is required.'
    if (!form.email.includes('@')) next.email = 'Valid email required.'
    if (!form.preferredProvider) next.preferredProvider = 'Preferred provider required.'
    if (form.carrier && !form.memberId) next.memberId = 'Member ID required when insurance is entered.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSave?.({
      firstName: form.firstName,
      lastName: form.lastName,
      dob: form.dob,
      gender: form.gender as PatientRecord['gender'],
      phone: form.phone,
      email: form.email,
      address: form.address,
      preferredLanguage: form.preferredLanguage,
      providerId: form.preferredProvider,
      providerName: PROVIDERS.find((p) => p.id === form.preferredProvider)?.name || PROVIDERS[0].name,
      specialNotes: form.specialNotes,
      emergencyContact: { name: form.emergencyName, relationship: form.emergencyRelationship, phone: form.emergencyPhone },
      insurance: {
        carrier: form.carrier || 'Uninsured',
        planName: form.carrier ? `${form.carrier} PPO` : 'None',
        memberId: form.memberId || '-',
        groupNumber: form.groupNumber || '-',
        effectiveDate: form.effectiveDate || new Date().toISOString().slice(0, 10),
        expiryDate: form.expiryDate || new Date().toISOString().slice(0, 10),
        copay: 30,
        status: (form.carrier ? 'active' : 'uninsured') as PatientRecord['insurance']['status'],
        secondary: form.secondaryEnabled
          ? {
              carrier: form.secondaryCarrier || 'Aetna',
              memberId: form.secondaryMemberId || 'S-NEW',
              groupNumber: form.secondaryGroup || 'SG-NEW',
              status: 'active',
            }
          : undefined,
      },
      medicalAlerts: form.allergies
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      medications: form.medications
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40">
      <button className="absolute inset-0 bg-black/25" aria-label="Close drawer backdrop" onClick={closeWithGuard} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[620px] overflow-auto border-l border-[#e8e8e4] bg-white p-6 shadow-xl transition-transform duration-250">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Patient Form</p>
            <h2 className="text-2xl font-extrabold text-[#1a1a1a]">{mode === 'add' ? 'Add Patient' : 'Edit Patient'}</h2>
          </div>
          <Button variant="ghost" onClick={closeWithGuard}>Close</Button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-7 pb-8">
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b7280]">1. Personal Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Input placeholder="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <Input placeholder="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
              </div>
              <div>
                <Input type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} />
                {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob}</p>}
              </div>
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
              </select>
              <Input placeholder="Preferred language" value={form.preferredLanguage} onChange={(e) => update('preferredLanguage', e.target.value)} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b7280]">2. Contact</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Input placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <Input placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <Input placeholder="Address" value={form.address} onChange={(e) => update('address', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b7280]">3. Emergency Contact</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="Name" value={form.emergencyName} onChange={(e) => update('emergencyName', e.target.value)} />
              <Input placeholder="Relationship" value={form.emergencyRelationship} onChange={(e) => update('emergencyRelationship', e.target.value)} />
              <Input placeholder="Phone" value={form.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b7280]">4. Medical History</h3>
            <Input placeholder="Allergies (comma separated)" value={form.allergies} onChange={(e) => update('allergies', e.target.value)} />
            <Input placeholder="Current medications (comma separated)" value={form.medications} onChange={(e) => update('medications', e.target.value)} />
            <div className="grid gap-2 sm:grid-cols-2">
              {['Diabetes', 'Heart Disease', 'Blood Thinners', 'Pregnancy'].map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.conditions.includes(c)}
                    onChange={(e) =>
                      update(
                        'conditions',
                        e.target.checked ? [...form.conditions, c] : form.conditions.filter((x) => x !== c),
                      )
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
            <Input placeholder="Other medical condition" value={form.conditionOther} onChange={(e) => update('conditionOther', e.target.value)} />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b7280]">5. Insurance</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Primary carrier" value={form.carrier} onChange={(e) => update('carrier', e.target.value)} />
              <div>
                <Input placeholder="Member ID" value={form.memberId} onChange={(e) => update('memberId', e.target.value)} />
                {errors.memberId && <p className="mt-1 text-xs text-red-600">{errors.memberId}</p>}
              </div>
              <Input placeholder="Group number" value={form.groupNumber} onChange={(e) => update('groupNumber', e.target.value)} />
              <Input type="date" value={form.effectiveDate} onChange={(e) => update('effectiveDate', e.target.value)} />
              <Input type="date" value={form.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} />
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.secondaryEnabled} onChange={(e) => update('secondaryEnabled', e.target.checked)} />
              Add secondary insurance
            </label>
            {form.secondaryEnabled && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Secondary carrier" value={form.secondaryCarrier} onChange={(e) => update('secondaryCarrier', e.target.value)} />
                <Input placeholder="Secondary member ID" value={form.secondaryMemberId} onChange={(e) => update('secondaryMemberId', e.target.value)} />
                <Input placeholder="Secondary group" value={form.secondaryGroup} onChange={(e) => update('secondaryGroup', e.target.value)} />
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b7280]">6. Preferences</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <select
                  className="w-full rounded-md border border-slate-300 p-2 text-sm"
                  value={form.preferredProvider}
                  onChange={(e) => update('preferredProvider', e.target.value)}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.preferredProvider && <p className="mt-1 text-xs text-red-600">{errors.preferredProvider}</p>}
              </div>
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={form.preferredTime} onChange={(e) => update('preferredTime', e.target.value)}>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={form.reminderPreference} onChange={(e) => update('reminderPreference', e.target.value)}>
                <option>SMS</option>
                <option>Email</option>
                <option>Both</option>
                <option>None</option>
              </select>
              <div className="sm:col-span-2">
                <Textarea placeholder="Special notes" value={form.specialNotes} onChange={(e) => update('specialNotes', e.target.value)} />
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#e8e8e4] bg-white pt-4">
            <Button type="button" variant="ghost" onClick={closeWithGuard}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </aside>
    </div>
  )
}
