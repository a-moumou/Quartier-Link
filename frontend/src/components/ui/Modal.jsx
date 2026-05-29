import { X } from 'lucide-react';
import { useEffect } from 'react';

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { const fn = (e) => { if (e.key === 'Escape') onClose?.(); }; if (isOpen) window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn); }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className={['relative bg-slate-900 rounded-2xl shadow-2xl border border-white/8 w-full max-h-[90vh] flex flex-col', sizes[size] ?? sizes.md].join(' ')}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
          </div>
        )}
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-white/8 shrink-0 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
