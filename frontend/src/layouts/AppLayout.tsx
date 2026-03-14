'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '../components/ui/button'
import { useAuthContext } from '../components/AuthContext'

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/patients', label: 'Patients' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/ehr', label: 'Clinical Notes' },
  { to: '/billing', label: 'Billing' },
]

type AppLayoutProps = {
  children: React.ReactNode
  sectionLabel?: string
  title?: string
  rightSlot?: React.ReactNode
}

export default function AppLayout({
  children,
  sectionLabel = 'DENTAL OPERATIONS',
  title = 'Dashboard & Analytics',
  rightSlot,
}: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { displayName, email, role, signOut } = useAuthContext()

  const onLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-[280px] overflow-auto border-r border-[#e8e8e4] bg-white px-5 py-6 lg:block">
        <h1 className="text-[30px] font-extrabold text-[#1a3c4d]">DentalOS</h1>
        <p className="mt-1 text-sm text-[#6b7280]">AI practice command center</p>

        <div className="mt-6 rounded-xl bg-[#13293d] p-4 text-white">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">User</p>
          <p className="mt-2 text-xl font-bold">{displayName}</p>
          <p className="text-sm text-slate-300">{email}</p>
          <span className="mt-3 inline-flex rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-100">
            {role.replace('_', ' ')}
          </span>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.to
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`rounded-full px-3 py-2 text-[14px] ${active ? 'bg-[#eef0ef] font-medium text-[#1a1a1a]' : 'text-[#6b7280]'}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="lg:ml-[280px]">
        <header className="border-b border-[#e8e8e4] bg-white px-5 py-5 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6b7280]">{sectionLabel}</p>
              <h1 className="mt-1 text-[30px] font-extrabold leading-tight text-[#1a1a1a]">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {rightSlot}
              <Button variant="ghost" className="border-[#e8e8e4] bg-white" onClick={onLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="bg-[#f5f4f0] px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
