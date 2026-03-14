import { PropsWithChildren } from 'react'
import { cn } from '../../lib/utils'

export function UICard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('rounded-3xl border border-slate-200/80 bg-[#f8fafb] p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]', className)}>
      {children}
    </div>
  )
}
