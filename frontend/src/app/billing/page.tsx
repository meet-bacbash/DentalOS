'use client'

import { Fragment, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import AppLayout from '../../layouts/AppLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Claim,
  Invoice,
  PROVIDERS,
  avatarColor,
  formatMoney,
  initialsOf,
  makeAppointmentsMock,
  makeClaimsMock,
  makeInvoicesMock,
} from '../../lib/opsMock'

type Tab = 'invoices' | 'claims'

function statusPill(status: string) {
  if (status === 'Paid') return 'bg-[#ecfdf3] text-[#15803d]'
  if (status === 'Partial' || status === 'Pending' || status === 'Submitted') return 'bg-[#fffbeb] text-[#b45309]'
  if (status === 'Denied' || status === 'Unpaid' || status === 'Overdue') return 'bg-[#fef2f2] text-[#b91c1c]'
  return 'bg-[#f3f4f6] text-[#6b7280]'
}

export default function BillingPage() {
  const appointments = useMemo(() => makeAppointmentsMock(), [])
  const [invoices, setInvoices] = useState<Invoice[]>(() => makeInvoicesMock(appointments))
  const [claims, setClaims] = useState<Claim[]>(() => makeClaimsMock(makeInvoicesMock(appointments)))
  const [tab, setTab] = useState<Tab>('invoices')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [carrierFilter, setCarrierFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null)

  const [paymentForm, setPaymentForm] = useState({ patientName: '', invoiceId: '', date: new Date().toISOString().slice(0, 10), amount: '', method: 'Card', reference: '', notes: '' })
  const [claimForm, setClaimForm] = useState({ patientName: '', carrier: '', memberId: '', groupNumber: '', invoiceId: '', diagnosis: '', codes: '', notes: '' })

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const q = search.trim().toLowerCase()
      if (q && !(i.patientName.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))) return false
      if (statusFilter !== 'all' && i.status !== statusFilter) return false
      if (providerFilter !== 'all' && i.provider !== providerFilter) return false
      if (carrierFilter !== 'all' && i.carrier !== carrierFilter) return false
      if (fromDate && i.date < fromDate) return false
      if (toDate && i.date > toDate) return false
      return true
    })
  }, [carrierFilter, fromDate, invoices, providerFilter, search, statusFilter, toDate])

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const q = search.trim().toLowerCase()
      if (q && !(c.patientName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (carrierFilter !== 'all' && c.carrier !== carrierFilter) return false
      if (fromDate && c.submittedDate < fromDate) return false
      if (toDate && c.submittedDate > toDate) return false
      return true
    })
  }, [carrierFilter, claims, fromDate, search, statusFilter, toDate])

  const summary = useMemo(() => {
    const totalBilled = filteredInvoices.reduce((s, i) => s + i.totalFee, 0)
    const collected = filteredInvoices.reduce((s, i) => s + i.paid, 0)
    const pendingInsurance = filteredClaims.filter((c) => c.status === 'Pending' || c.status === 'Submitted').reduce((s, c) => s + c.amountBilled, 0)
    const outstanding = filteredInvoices.reduce((s, i) => s + i.balance, 0)
    return { totalBilled, collected, pendingInsurance, outstanding }
  }, [filteredClaims, filteredInvoices])

  const recordPayment = () => {
    const amt = Number(paymentForm.amount || 0)
    if (!paymentForm.invoiceId || amt <= 0) return
    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id !== paymentForm.invoiceId) return i
        const paid = i.paid + amt
        const balance = Math.max(0, i.totalFee - paid)
        const status = balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : i.status
        return { ...i, paid, balance, status }
      }),
    )
    setPaymentOpen(false)
  }

  const submitClaim = () => {
    if (!claimForm.invoiceId) return
    const inv = invoices.find((i) => i.id === claimForm.invoiceId)
    if (!inv) return
    setClaims((prev) => [
      {
        id: `CLM-${9000 + prev.length}`,
        submittedDate: new Date().toISOString().slice(0, 10),
        patientName: claimForm.patientName || inv.patientName,
        patientId: inv.patientId,
        carrier: claimForm.carrier || inv.carrier,
        procedures: inv.procedures,
        amountBilled: inv.totalFee,
        amountPaid: 0,
        status: 'Submitted',
      },
      ...prev,
    ])
    setClaimOpen(false)
  }

  return (
    <AuthGuard>
      <AppLayout
        sectionLabel="BILLING"
        title="Billing"
        rightSlot={<Button variant="ghost" className="border-[#1a3c4d] text-[#1a3c4d]" onClick={() => setPaymentOpen(true)}>Record Payment</Button>}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Total Billed: <strong>{formatMoney(summary.totalBilled)}</strong></span>
            <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Collected: <strong>{formatMoney(summary.collected)}</strong></span>
            <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Pending Insurance: <strong>{formatMoney(summary.pendingInsurance)}</strong></span>
            <span className="rounded-full border border-[#e8e8e4] bg-white px-3 py-1 text-sm">Outstanding: <strong>{formatMoney(summary.outstanding)}</strong></span>
          </div>

          <div className="rounded-xl border border-[#e8e8e4] bg-white p-3">
            <div className="grid gap-2 md:grid-cols-6">
              <Input placeholder="Search patient/invoice" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                {['Paid', 'Partial', 'Unpaid', 'Overdue', 'Pending', 'Submitted', 'Denied'].map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
                <option value="all">All Providers</option>
                {PROVIDERS.map((p) => <option key={p.id}>{p.name}</option>)}
              </select>
              <select className="rounded-md border border-slate-300 p-2 text-sm" value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}>
                <option value="all">All Carriers</option>
                {Array.from(new Set(invoices.map((i) => i.carrier))).map((c) => <option key={c}>{c}</option>)}
              </select>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-[#e8e8e4]">
            <button className={`pb-2 text-sm font-medium ${tab === 'invoices' ? 'border-b-2 border-[#1a3c4d] text-[#1a3c4d]' : 'text-[#6b7280]'}`} onClick={() => setTab('invoices')}>Invoices</button>
            <button className={`pb-2 text-sm font-medium ${tab === 'claims' ? 'border-b-2 border-[#1a3c4d] text-[#1a3c4d]' : 'text-[#6b7280]'}`} onClick={() => setTab('claims')}>Claims</button>
          </div>

          {tab === 'invoices' && (
            <div className="overflow-auto rounded-xl border border-[#e8e8e4] bg-white">
              <table className="w-full min-w-[1400px] text-sm">
                <thead>
                  <tr className="h-11 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">
                    <th className="px-3">Invoice #</th><th className="px-3">Date</th><th className="px-3">Patient</th><th className="px-3">Provider</th><th className="px-3">Procedures</th><th className="px-3">Total Fee</th><th className="px-3">Insurance Est.</th><th className="px-3">Patient Portion</th><th className="px-3">Paid</th><th className="px-3">Balance</th><th className="px-3">Status</th><th className="px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <Fragment key={inv.id}>
                      <tr className={`h-12 border-b border-[#f0f0ec] hover:bg-[#f9f9f7] ${inv.status === 'Overdue' ? 'border-l-2 border-l-red-300' : ''}`}>
                        <td className="px-3">{inv.id}</td>
                        <td className="px-3">{inv.date}</td>
                        <td className="px-3"><div className="flex items-center gap-2"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: avatarColor(inv.patientName) }}>{initialsOf(inv.patientName)}</span>{inv.patientName}</div></td>
                        <td className="px-3">{inv.provider}</td>
                        <td className="px-3">{inv.procedures.join(', ')}</td>
                        <td className="px-3">{formatMoney(inv.totalFee)}</td>
                        <td className="px-3">{formatMoney(inv.insuranceEst)}</td>
                        <td className="px-3">{formatMoney(inv.patientPortion)}</td>
                        <td className="px-3">{formatMoney(inv.paid)}</td>
                        <td className="px-3">{formatMoney(inv.balance)}</td>
                        <td className="px-3"><span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusPill(inv.status)}`}>{inv.status}</span></td>
                        <td className="px-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" onClick={() => { setActiveInvoice(inv); setPaymentForm({ ...paymentForm, patientName: inv.patientName, invoiceId: inv.id }); setPaymentOpen(true) }}>Record Payment</Button>
                            <Button variant="ghost" onClick={() => { setActiveInvoice(inv); setClaimForm({ ...claimForm, patientName: inv.patientName, invoiceId: inv.id, carrier: inv.carrier }); setClaimOpen(true) }}>Submit Claim</Button>
                            <Button variant="ghost" onClick={() => setExpanded((p) => ({ ...p, [inv.id]: !p[inv.id] }))}>View</Button>
                          </div>
                        </td>
                      </tr>
                      {expanded[inv.id] && (
                        <tr className="border-b border-[#f0f0ec] bg-[#fafaf8]">
                          <td colSpan={12} className="p-3">
                            <table className="w-full text-sm">
                              <thead><tr className="text-left text-[11px] uppercase tracking-[0.14em] text-[#6b7280]"><th>Code</th><th>Procedure</th><th>Fee</th></tr></thead>
                              <tbody>
                                {inv.lineItems.map((li, i) => <tr key={i}><td>{li.code}</td><td>{li.name}</td><td>{formatMoney(li.fee)}</td></tr>)}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'claims' && (
            <div className="overflow-auto rounded-xl border border-[#e8e8e4] bg-white">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="h-11 border-b border-[#e8e8e4] text-left text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">
                    <th className="px-3">Claim #</th><th className="px-3">Submitted Date</th><th className="px-3">Patient</th><th className="px-3">Insurance Carrier</th><th className="px-3">Procedures</th><th className="px-3">Amount Billed</th><th className="px-3">Amount Paid</th><th className="px-3">Status</th><th className="px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((c) => (
                    <tr key={c.id} className="h-12 border-b border-[#f0f0ec] hover:bg-[#f9f9f7]">
                      <td className="px-3">{c.id}</td><td className="px-3">{c.submittedDate}</td><td className="px-3">{c.patientName}</td><td className="px-3">{c.carrier}</td><td className="px-3">{c.procedures.join(', ')}</td><td className="px-3">{formatMoney(c.amountBilled)}</td><td className="px-3">{formatMoney(c.amountPaid)}</td>
                      <td className="px-3"><span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusPill(c.status)}`}>{c.status}</span></td>
                      <td className="px-3">{c.status === 'Denied' ? <Button variant="ghost">Resubmit</Button> : <Button variant="ghost">View</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {paymentOpen && (
          <div className="fixed inset-0 z-40">
            <button className="absolute inset-0 bg-black/25" onClick={() => setPaymentOpen(false)} />
            <aside className="absolute right-0 top-0 h-full w-full max-w-[540px] overflow-auto border-l border-[#e8e8e4] bg-white p-5">
              <h3 className="text-2xl font-extrabold">Record Payment</h3>
              <p className="mt-1 rounded-md bg-[#fffbeb] p-2 text-sm text-[#b45309]">Current open balance: {activeInvoice ? formatMoney(activeInvoice.balance) : '$0.00'}</p>
              <div className="mt-3 grid gap-3">
                <Input placeholder="Patient" value={paymentForm.patientName} onChange={(e) => setPaymentForm({ ...paymentForm, patientName: e.target.value })} />
                <select className="rounded-md border border-slate-300 p-2 text-sm" value={paymentForm.invoiceId} onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}>
                  <option value="">Select invoice</option>
                  {invoices.filter((i) => i.balance > 0 && (!paymentForm.patientName || i.patientName.toLowerCase().includes(paymentForm.patientName.toLowerCase()))).map((i) => <option key={i.id} value={i.id}>{i.id} • {i.patientName} • {formatMoney(i.balance)}</option>)}
                </select>
                <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
                <Input placeholder="Amount" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                <select className="rounded-md border border-slate-300 p-2 text-sm" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                  {['Cash', 'Card', 'Check', 'Insurance', 'Write-off'].map((m) => <option key={m}>{m}</option>)}
                </select>
                <Input placeholder="Reference #" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
                <textarea className="w-full rounded-md border border-slate-300 p-2 text-sm" rows={3} placeholder="Notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
              </div>
              <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setPaymentOpen(false)}>Cancel</Button><Button onClick={recordPayment}>Save</Button></div>
            </aside>
          </div>
        )}

        {claimOpen && (
          <div className="fixed inset-0 z-40">
            <button className="absolute inset-0 bg-black/25" onClick={() => setClaimOpen(false)} />
            <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-auto border-l border-[#e8e8e4] bg-white p-5">
              <h3 className="text-2xl font-extrabold">Submit Claim</h3>
              <div className="mt-3 grid gap-3">
                <Input placeholder="Patient" value={claimForm.patientName} onChange={(e) => setClaimForm({ ...claimForm, patientName: e.target.value })} />
                <Input placeholder="Insurance carrier" value={claimForm.carrier} onChange={(e) => setClaimForm({ ...claimForm, carrier: e.target.value })} />
                <div className="grid grid-cols-2 gap-2"><Input placeholder="Member ID" value={claimForm.memberId} onChange={(e) => setClaimForm({ ...claimForm, memberId: e.target.value })} /><Input placeholder="Group number" value={claimForm.groupNumber} onChange={(e) => setClaimForm({ ...claimForm, groupNumber: e.target.value })} /></div>
                <select className="rounded-md border border-slate-300 p-2 text-sm" value={claimForm.invoiceId} onChange={(e) => setClaimForm({ ...claimForm, invoiceId: e.target.value })}>
                  <option value="">Linked invoice</option>
                  {invoices.map((i) => <option key={i.id} value={i.id}>{i.id} • {i.patientName}</option>)}
                </select>
                <div className="rounded-md border border-[#e8e8e4] p-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">Procedures to include</p>
                  {(invoices.find((i) => i.id === claimForm.invoiceId)?.lineItems || []).map((li) => (
                    <label key={li.code} className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> {li.code} • {li.name}</label>
                  ))}
                </div>
                <Input placeholder="Diagnosis codes (ICD-10)" value={claimForm.diagnosis} onChange={(e) => setClaimForm({ ...claimForm, diagnosis: e.target.value })} />
                <Input placeholder="Procedure codes (CDT)" value={claimForm.codes} onChange={(e) => setClaimForm({ ...claimForm, codes: e.target.value })} />
                <label className="rounded-md border border-slate-300 p-2 text-sm">Attachments <input className="block mt-1" type="file" multiple /></label>
                <textarea className="w-full rounded-md border border-slate-300 p-2 text-sm" rows={3} placeholder="Notes to insurer" value={claimForm.notes} onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })} />
              </div>
              <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setClaimOpen(false)}>Cancel</Button><Button onClick={submitClaim}>Submit</Button></div>
            </aside>
          </div>
        )}
      </AppLayout>
    </AuthGuard>
  )
}
