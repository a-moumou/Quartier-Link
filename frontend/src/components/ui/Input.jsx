import { useId } from 'react';

export default function Input({
  label,
  error,
  className = '',
  icon: Icon,
  hint,
  textarea = false,
  rows = 3,
  ...props
}) {
  // RGAA 11.1 : chaque champ doit avoir une etiquette qui lui est
  // rattachee. Sans ce lien, un lecteur d'ecran annonce « champ de
  // saisie » sans dire de quoi il s'agit, et cliquer sur le libelle
  // ne place pas le curseur dans le champ.
  const idAuto  = useId();
  const idChamp = props.id ?? idAuto;
  const idAide  = `${idChamp}-aide`;
  const base = [
    'w-full rounded-md text-sm text-[#e6edf3] bg-[#0f1117]',
    'border border-[#30363d]',
    'placeholder:text-[#6e7681]',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500',
    'hover:border-[#484f58]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#30363d]',
    error ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500' : '',
    Icon ? 'pl-9 pr-3 py-2.5' : 'px-3 py-2.5',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={idChamp} className="text-xs font-medium text-[#e6edf3]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none">
            <Icon size={15} />
          </span>
        )}
        {textarea
          ? <textarea
              id={idChamp}
              className={base}
              rows={rows}
              aria-invalid={error ? true : undefined}
              aria-describedby={error || hint ? idAide : undefined}
              {...props}
            />
          : <input
              id={idChamp}
              className={base}
              aria-invalid={error ? true : undefined}
              aria-describedby={error || hint ? idAide : undefined}
              {...props}
            />
        }
      </div>
      {error && <p id={idAide} className="text-xs text-red-400" role="alert">{error}</p>}
      {hint && !error && <p id={idAide} className="text-xs text-[#8b949e]">{hint}</p>}
    </div>
  );
}
