type Props = { label: string; value: string | number }

export default function KPI({ label, value }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-[#f8fafb] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-5xl font-extrabold tracking-tight text-[#1a2433]">{value}</p>
    </div>
  )
}
