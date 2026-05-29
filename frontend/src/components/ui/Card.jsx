export default function Card({ children, className = '', onClick, hover = false, padding = true }) {
  return (
    <div
      className={[
        'bg-slate-900 rounded-2xl border border-white/8',
        padding ? 'p-6' : '',
        hover ? 'hover:border-white/15 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
