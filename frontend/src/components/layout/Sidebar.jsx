import { NavLink } from 'react-router-dom';
import { Home, Users, MessageSquare, User, Settings, ShieldCheck, ShieldAlert, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const mainNav = [
  { to: '/dashboard', icon: Home,         label: 'Fil d\'actualité' },
  { to: '/members',   icon: Users,        label: 'Voisins'          },
  { to: '/messages',  icon: MessageSquare, label: 'Messages'        },
];

const accountNav = [
  { to: '/profile',  icon: User,     label: 'Mon profil'  },
  { to: '/settings', icon: Settings, label: 'Paramètres'  },
];

function NavItem({ to, icon: Icon, label, onClick, accent = false }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => [
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        isActive
          ? accent
            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
          : 'text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent',
      ].join(' ')}
    >
      <Icon size={17} className="shrink-0" />
      {label}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin      = user?.role === 'admin' || isSuperAdmin;
  const isVerified   = user?.isVerified;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden" onClick={onClose} />}

      <aside className={[
        'fixed top-0 left-0 bottom-0 z-40 w-64 flex flex-col',
        'bg-slate-950 border-r border-white/5',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5 shrink-0">
          <div className="size-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">QuartierLink</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-700 mb-2">Navigation</p>
          {mainNav.map((item) => <NavItem key={item.to} {...item} onClick={onClose} />)}

          <div className="pt-4 mt-2 border-t border-white/5 space-y-0.5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-700 mb-2">Compte</p>
            {accountNav.map((item) => <NavItem key={item.to} {...item} onClick={onClose} />)}
            {isVerified && <NavItem to="/neighborhoods/create" icon={PlusCircle} label="Créer un quartier" onClick={onClose} />}
            {isAdmin && !isSuperAdmin && <NavItem to="/admin" icon={ShieldCheck} label="Administration" onClick={onClose} />}
            {isSuperAdmin && <NavItem to="/super-admin" icon={ShieldAlert} label="Admin général" onClick={onClose} accent />}
          </div>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
              <div className="mt-0.5">
                {isSuperAdmin ? <Badge variant="purple">Super Admin</Badge>
                  : user?.isVerified ? <Badge variant="success">Vérifié</Badge>
                  : <Badge variant="warning">En attente</Badge>}
              </div>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Se déconnecter">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
