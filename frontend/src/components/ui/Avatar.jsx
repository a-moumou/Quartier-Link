const COLORS = [
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-sky-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-violet-600',
  'bg-fuchsia-600',
  'bg-orange-600',
  'bg-teal-600',
];

const sizes = {
  xs: 'size-6  text-[10px]',
  sm: 'size-8  text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
  '2xl': 'size-24 text-2xl',
};

export default function Avatar({ name = '', src, size = 'md', className = '', online }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];
  const sizeCls = sizes[size] ?? sizes.md;

  return (
    <div className={['relative inline-flex shrink-0', className].join(' ')}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={['rounded-full object-cover border border-[#30363d]', sizeCls].join(' ')}
        />
      ) : (
        <div
          className={[
            sizeCls,
            color,
            'rounded-full flex items-center justify-center text-white font-semibold border border-[#30363d]',
          ].join(' ')}
        >
          {initials}
        </div>
      )}
      {online != null && (
        <span
          className={[
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-[#0f1117]',
            size === 'xs' || size === 'sm' ? 'size-2' : 'size-2.5',
            online ? 'bg-emerald-500' : 'bg-[#6e7681]',
          ].join(' ')}
        />
      )}
    </div>
  );
}
