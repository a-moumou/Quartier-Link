import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function ComposeSheet({
  open, onClose, user, content, onChange, onSubmit, posting,
  quartiers, quartierId, onQuartierChange,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-4 top-[10%] z-[90] bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-xl mx-auto shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#e6edf3]">Nouvelle publication</p>
                  {quartiers?.length > 1 ? (
                    <select
                      value={quartierId}
                      onChange={(e) => onQuartierChange(e.target.value)}
                      className="text-xs text-emerald-400 bg-transparent border-none cursor-pointer mt-0.5 max-w-full
                                 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    >
                      {quartiers.map((q) => (
                        <option key={q.id} value={String(q.id)} className="bg-[#0f1117]">
                          {q.nom ?? q.name}
                        </option>
                      ))}
                    </select>
                  ) : quartiers?.[0] && (
                    <p className="text-xs text-[#8b949e] mt-0.5 truncate">{quartiers[0].nom ?? quartiers[0].name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <textarea
              autoFocus
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Quoi de neuf dans le quartier ?"
              rows={5}
              className="w-full resize-none text-sm text-[#e6edf3] placeholder:text-[#6e7681] bg-[#0f1117] rounded-md border border-[#30363d] px-3 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-[#6e7681]">
                {content?.length ?? 0} caractères
              </p>
              <Button onClick={onSubmit} loading={posting} disabled={!content?.trim()} size="md">
                <Send size={14} /> Publier
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
