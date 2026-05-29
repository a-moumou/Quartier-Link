export default function Input({ label, error, className = '', icon: Icon, hint, textarea = false, rows = 3, ...props }) {
  const base = [
    'w-full rounded-xl text-sm text-white bg-slate-800',
    'border border-white/8 placeholder:text-slate-600',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
    'hover:border-white/15',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    error ? 'border-red-500/50 focus:ring-red-500' : '',
    Icon ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        {textarea
          ? <textarea className={base} rows={rows} {...props} />
          : <input className={base} {...props} />
        }
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
