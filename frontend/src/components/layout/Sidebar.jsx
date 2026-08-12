import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Users, MessageSquare, User, Settings,
  ShieldCheck, ShieldAlert, PlusCircle, LogOut,
  Map,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Logo from '../ui/Logo';

const mainNav = [
  { to: '/dashboard', icon: Home,          label: 'Fil d\'actualité' },
  { to: '/members',   icon: Users,         label: 'Voisins' },
  { to: '/messages',  icon: MessageSquare, label: 'Messages' },
];

const accountNav = [
  { to: '/profile',  icon: User,     label: 'Mon profil' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

function NavItem({ to, icon: Icon, label, accent = false }) {
  return (
    <NavLink to={to} end className="block">
      {({ isActive }) => (
        <div
          className={[
            'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
            isActive
              ? accent
                ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/25'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
              : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] border border-transparent',
          ].join(' ')}
        >
          <Icon size={16} strokeWidth={isActive ? 2.25 : 2} className="shrink-0" />
          <span className="truncate">{label}</span>
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin      = user?.role === 'admin' || isSuperAdmin;
  const isVerified   = user?.isVerified;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 z-40 w-64 flex-col bg-[#0d1017] border-r border-[#30363d]/80">
      <div className="px-5 h-16 border-b border-[#30363d]/80 shrink-0 flex items-center">
        <Logo to="/dashboard" size="sm" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681] mb-2 mt-1">
          Navigation
        </p>
        {mainNav.map((item) => <NavItem key={item.to} {...item} />)}

        <div className="pt-4 mt-3 border-t border-[#30363d]/80 space-y-1">
          <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681] mb-2">
            Compte
          </p>
          {accountNav.map((item) => <NavItem key={item.to} {...item} />)}
          {isVerified && (
            <NavItem to="/neighborhoods/create" icon={PlusCircle} label="Créer un quartier" />
          )}
          {isAdmin && !isSuperAdmin && (
            <NavItem to="/admin" icon={ShieldCheck} label="Administration" />
          )}
          {isSuperAdmin && (
            <NavItem to="/super-admin" icon={ShieldAlert} label="Admin général" accent />
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-[#30363d]/80 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-[#161b22] border border-[#30363d]/60">
          <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#e6edf3] truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="mt-0.5">
              {isSuperAdmin ? (
                <Badge variant="purple">Super Admin</Badge>
              ) : user?.isVerified ? (
                <Badge variant="success">Vérifié</Badge>
              ) : (
                <Badge variant="warning">En attente</Badge>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
