import { NavLink } from 'react-router-dom';
import { Home, Users, MessageSquare, User, Settings } from 'lucide-react';

const tabs = [
  { to: '/dashboard', icon: Home,          label: 'Fil' },
  { to: '/members',   icon: Users,         label: 'Voisins' },
  { to: '/messages',  icon: MessageSquare, label: 'Messages' },
  { to: '/profile',   icon: User,          label: 'Profil' },
  { to: '/settings',  icon: Settings,      label: 'Plus' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1017]/95 backdrop-blur-md border-t border-[#30363d]/80">
      <div className="grid grid-cols-5 max-w-2xl mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end className="relative">
            {({ isActive }) => (
              <div
                className={[
                  'flex flex-col items-center justify-center gap-1 py-2.5 transition-colors',
                  isActive ? 'text-emerald-400' : 'text-[#8b949e]',
                ].join(' ')}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-b-full" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
