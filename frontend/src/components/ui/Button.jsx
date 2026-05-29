const variants = {
  primary:  'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-sm shadow-indigo-500/30',
  secondary:'bg-white/8 hover:bg-white/12 text-slate-300 border border-white/10',
  danger:   'bg-red-500/90 hover:bg-red-600 text-white shadow-sm shadow-red-500/20',
  ghost:    'hover:bg-white/8 text-slate-400 hover:text-white',
  outline:  'border border-white/10 hover:bg-white/8 text-slate-300',
  'outline-primary': 'border border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400',
  dark:     'bg-slate-800 hover:bg-slate-700 text-white border border-white/8',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
};

export default function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', type = 'button', onClick, fullWidth = false, ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium rounded-xl',
        'transition-all duration-150 cursor-pointer select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
