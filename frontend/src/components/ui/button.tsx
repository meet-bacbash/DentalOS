import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'amber' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export function Button({ className, variant = 'primary', ...props }: Props) {
  const base = 'rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-50'
  const styles: Record<Variant, string> = {
    primary: 'border-[#0f2a4a] bg-[#0f2a4a] text-white hover:bg-[#162f50]',
    amber: 'border-[#d8a24a] bg-[#d8a24a] text-white hover:bg-[#c99235]',
    ghost: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  }
  return <button className={cn(base, styles[variant], className)} {...props} />
}
