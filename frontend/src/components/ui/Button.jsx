const variants = {
  primary:
    'bg-emerald-500 hover:bg-emerald-400 text-white border border-emerald-500 hover:border-emerald-400 shadow-sm shadow-emerald-900/40',
  secondary:
    'bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d]/80 hover:border-[#484f58]',
  ghost:
    'bg-transparent hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] border border-transparent',
  outline:
    'bg-transparent hover:bg-[#21262d] text-[#e6edf3] border border-[#30363d]',
  'outline-primary':
    'bg-transparent hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 hover:border-emerald-500/60',
  danger:
    'bg-red-500 hover:bg-red-400 text-white border border-red-500 hover:border-red-400 shadow-sm shadow-red-900/40',
  dark:
    'bg-[#161b22] hover:bg-[#1c222b] text-[#e6edf3] border border-[#30363d]/80',
};

const sizes = {
  xs: 'h-7  px-2.5 text-xs gap-1.5',
  sm: 'h-8  px-3   text-xs gap-1.5',
  md: 'h-9  px-3.5 text-sm gap-2',
  lg: 'h-10 px-5   text-sm gap-2',
  xl: 'h-12 px-6   text-base gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-md',
        'transition-colors duration-150 cursor-pointer select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1117]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'whitespace-nowrap',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
