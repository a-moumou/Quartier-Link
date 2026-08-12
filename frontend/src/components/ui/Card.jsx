export default function Card({
  children,
  className = '',
  onClick,
  hover = false,
  padding = true,
}) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-[#161b22] border border-[#30363d] rounded-xl',
        padding ? 'p-5' : '',
        hover
          ? 'transition-colors duration-150 cursor-pointer hover:border-emerald-500/40 hover:bg-[#1c222b]'
          : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
