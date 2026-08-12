import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Settings, PlusCircle, ShieldCheck, ShieldAlert, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Logo from '../ui/Logo';

export default function AppMenu({ open, onClose }) {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  const links = [
    { to: '/profile',  icon: User,     label: 'Mon profil' },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
    ...(user?.isVerified ? [{ to: '/neighborhoods/create', icon: PlusCircle, label: 'Créer un quartier' }] : []),
    ...(isAdmin && !isSuperAdmin ? [{ to: '/admin', icon: ShieldCheck, label: 'Administration' }] : []),
    ...(isSuperAdmin ? [{ to: '/super-admin', icon: ShieldAlert, label: 'Admin général', accent: true }] : []),
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#161b22] border-t border-[#30363d] rounded-t-xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#30363d]" />
            </div>

            <div className="px-5 pt-3 pb-8">
              <div className="flex justify-center mb-5">
                <Logo to="/dashboard" size="sm" />
              </div>

              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size="lg" />
                  <div>
                    <p className="font-semibold text-[#e6edf3]">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-[#8b949e] mt-0.5 truncate">{user?.email}</p>
                    <div className="mt-1.5">
                      {isSuperAdmin ? (
                        <Badge variant="purple">Super Admin</Badge>
                      ) : user?.isVerified ? (
                        <Badge variant="success">Vérifié</Badge>
                      ) : (
                        <Badge variant="warning">En attente</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1">
                {links.map(({ to, icon: Icon, label, accent }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={[
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      accent
                        ? 'text-indigo-300 hover:bg-indigo-500/10'
                        : 'text-[#e6edf3] hover:bg-[#21262d]',
                    ].join(' ')}
                  >
                    <Icon size={16} /> {label}
                  </Link>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#30363d]">
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} /> Se déconnecter
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
