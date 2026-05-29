const COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
  'bg-cyan-500',   'bg-amber-500',  'bg-teal-500',
  'bg-rose-500',   'bg-blue-500',   'bg-orange-500', 'bg-emerald-500',
];

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

export default function Avatar({ name = '', src, size = 'md', className = '', online }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

  return (
    <div className={['relative inline-flex shrink-0', className].join(' ')}>
      {src ? (
        <img src={src} alt={name} className={['rounded-full object-cover ring-2 ring-slate-900', sizes[size]].join(' ')} />
      ) : (
        <div className={[sizes[size], color, 'rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-slate-900'].join(' ')}>
          {initials}
        </div>
      )}
      {online != null && (
        <span className={[
          'absolute bottom-0 right-0 block rounded-full ring-2 ring-slate-900',
          size === 'xs' || size === 'sm' ? 'size-2' : 'size-2.5',
          online ? 'bg-emerald-400' : 'bg-slate-600',
        ].join(' ')} />
      )}
    </div>
  );
}
