import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/dashboard':  'Fil d\'actualité',
  '/members':    'Voisins',
  '/messages':   'Messages',
  '/profile':    'Mon profil',
  '/settings':   'Paramètres',
  '/admin':      'Administration',
  '/super-admin': 'Admin général',
  '/neighborhoods/create': 'Nouveau quartier',
};

function getTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/neighborhoods/')) return 'Quartier';
  return 'QuartierLink';
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const title = getTitle(pathname);
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#0d1017]/90 backdrop-blur-md border-b border-[#30363d]/80 flex items-center px-4">
        <Logo to="/dashboard" size="sm" />
        <span className="ml-auto text-xs text-[#8b949e] font-medium">{title}</span>
        <button
          onClick={() => navigate('/profile')}
          className="ml-3 inline-flex items-center"
          aria-label="Profil"
        >
          <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size="sm" />
        </button>
      </header>

      {/* Desktop top bar */}
      <header className="hidden lg:flex sticky top-0 z-30 h-14 bg-[#0f1117]/85 backdrop-blur-md border-b border-[#30363d]/80 items-center px-8">
        <h1 className="text-base font-semibold text-[#e6edf3] tracking-tight">{title}</h1>
        <div className="ml-auto flex items-center gap-1">
          <button
            className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 size-1.5 bg-emerald-500 rounded-full" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 rounded-md hover:bg-[#21262d] transition-colors"
              aria-label="Menu utilisateur"
            >
              <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size="sm" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#161b22] border border-[#30363d] rounded-md shadow-xl shadow-black/40 py-1 z-50 ql-fade-up">
                <div className="px-3 py-2 border-b border-[#30363d]">
                  <p className="text-sm font-semibold text-[#e6edf3] truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-[#8b949e] truncate mt-0.5">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#e6edf3] hover:bg-[#21262d] transition-colors"
                >
                  Mon profil
                </Link>
                {isSuperAdmin && (
                  <Link
                    to="/super-admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-300 hover:bg-[#21262d] transition-colors"
                  >
                    Admin général
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} /> Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
