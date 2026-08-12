import { X } from 'lucide-react';
import { useEffect } from 'react';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
      />
      <div
        className={[
          'relative bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl shadow-black/60',
          'w-full max-h-[90vh] flex flex-col ql-fade-up',
          sizes[size] ?? sizes.md,
        ].join(' ')}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] shrink-0">
            <h2 className="text-sm font-semibold text-[#e6edf3]">{title}</h2>
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
