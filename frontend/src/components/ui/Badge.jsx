const variants = {
  default: 'bg-white/8 text-slate-400',
  success: 'bg-emerald-500/15 text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-400',
  danger:  'bg-red-500/15 text-red-400',
  info:    'bg-indigo-500/15 text-indigo-400',
  primary: 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white',
  purple:  'bg-violet-500/15 text-violet-400',
  dark:    'bg-slate-700 text-slate-300',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={[
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant] ?? variants.default,
      className,
    ].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
