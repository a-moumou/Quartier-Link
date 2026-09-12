import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  const boite    = useRef(null);
  const avant    = useRef(null);
  const idTitre  = useId();
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // RGAA 7.x — une boite de dialogue doit retenir le focus. Sans piege,
  // la tabulation passe derriere la fenetre et l'utilisateur au clavier
  // parcourt une page qu'il ne voit plus.
  useEffect(() => {
    if (!isOpen) return undefined;

    avant.current = document.activeElement;

    const focusables = () => Array.from(
      boite.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), ' +
        'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    focusables()[0]?.focus();

    const fn = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key !== 'Tab') return;

      const liste = focusables();
      if (liste.length === 0) return;
      const premier = liste[0];
      const dernier = liste[liste.length - 1];

      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };

    window.addEventListener('keydown', fn);
    return () => {
      window.removeEventListener('keydown', fn);
      // Le focus revient a l'element qui a ouvert la modale.
      if (avant.current instanceof HTMLElement) avant.current.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={boite}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? idTitre : undefined}
        className={[
          'relative bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl shadow-black/60',
          'w-full max-h-[90vh] flex flex-col ql-fade-up',
          sizes[size] ?? sizes.md,
        ].join(' ')}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] shrink-0">
            <h2 id={idTitre} className="text-sm font-semibold text-[#e6edf3]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5 flex-1 text-sm text-[#e6edf3]">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-[#30363d] shrink-0 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
