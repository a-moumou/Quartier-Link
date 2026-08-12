import { Link } from 'react-router-dom';

const SIZES = {
  xs: { box: 'size-7',  text: 'text-sm',  iconSize: 14, gap: 'gap-2' },
  sm: { box: 'size-8',  text: 'text-base', iconSize: 16, gap: 'gap-2' },
  md: { box: 'size-9',  text: 'text-lg',  iconSize: 18, gap: 'gap-2.5' },
  lg: { box: 'size-11', text: 'text-xl',  iconSize: 22, gap: 'gap-3' },
  xl: { box: 'size-14', text: 'text-2xl', iconSize: 28, gap: 'gap-3' },
};

function Mark({ size }) {
  const sz = SIZES[size] ?? SIZES.md;
  return (
    <span
      className={[
        sz.box,
        'rounded-md flex items-center justify-center shrink-0',
        'bg-emerald-500 text-white shadow-sm shadow-emerald-900/40',
      ].join(' ')}
      aria-hidden="true"
    >
      <svg
        width={sz.iconSize}
        height={sz.iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2.5C7.5 2.5 4 6 4 10.2c0 5.4 5.6 9.8 7.5 11.1.3.2.7.2 1 0 1.9-1.3 7.5-5.7 7.5-11.1 0-4.2-3.5-7.7-8-7.7Z" />
        <circle cx="12" cy="10" r="2.6" />
      </svg>
    </span>
  );
}

export default function Logo({ to = '/', size = 'md', className = '', showText = true }) {
  const sz = SIZES[size] ?? SIZES.md;

  const content = (
    <span className={['inline-flex items-center', sz.gap, className].join(' ')}>
      <Mark size={size} />
      {showText && (
        <span className={[sz.text, 'font-bold tracking-tight text-[#e6edf3]'].join(' ')}>
          QuartierLink
        </span>
      )}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
