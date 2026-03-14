import { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-primary', className)} {...props} />
}
