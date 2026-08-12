const variants = {
  default: 'bg-[#21262d] text-[#8b949e] border border-[#30363d]',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  danger:  'bg-red-500/10 text-red-400 border border-red-500/30',
  info:    'bg-sky-500/10 text-sky-400 border border-sky-500/30',
  primary: 'bg-emerald-500 text-white border border-emerald-500',
  purple:  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
  dark:    'bg-[#0f1117] text-[#e6edf3] border border-[#30363d]',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-none h-5',
        variants[variant] ?? variants.default,
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  );
}
