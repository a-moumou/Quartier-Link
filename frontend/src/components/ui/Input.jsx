export default function Input({
  label,
  error,
  className = '',
  icon: Icon,
  hint,
  textarea = false,
  rows = 3,
  ...props
}) {
  const base = [
    'w-full rounded-md text-sm text-[#e6edf3] bg-[#0f1117]',
    'border border-[#30363d]',
    'placeholder:text-[#6e7681]',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500',
    'hover:border-[#484f58]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#30363d]',
    error ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500' : '',
    Icon ? 'pl-9 pr-3 py-2.5' : 'px-3 py-2.5',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[#e6edf3]">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none">
            <Icon size={15} />
          </span>
        )}
        {textarea
          ? <textarea className={base} rows={rows} {...props} />
          : <input className={base} {...props} />
        }
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#8b949e]">{hint}</p>}
    </div>
  );
}
