import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, LogOut, User, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';

export default function Navbar({ onMenuToggle, menuOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0f1117]/90 backdrop-blur-md border-b border-[#30363d]/80 flex items-center lg:pl-64">
      <div className="flex items-center justify-between w-full px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md hover:bg-[#21262d] text-[#8b949e] transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
          {!user && <Logo to="/" size="sm" />}
        </div>

        {user ? (
          <div className="flex items-center gap-1">
            <Link
              to="/messages"
              className="p-2 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              <MessageSquare size={18} />
            </Link>
            <button
              className="relative p-2 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 size-1.5 bg-emerald-500 rounded-full" />
            </button>

            <div className="relative ml-1" ref={dropRef}>
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-md hover:bg-[#21262d] transition-colors"
              >
                <Avatar name={`${user.firstName ?? ''} ${user.lastName ?? ''}`} size="sm" />
                <span className="text-sm font-medium text-[#e6edf3] hidden sm:block">{user.firstName}</span>
                <ChevronDown size={14} className="text-[#8b949e] hidden sm:block" />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#161b22] border border-[#30363d] rounded-md shadow-xl shadow-black/40 py-1 z-50">
                  <div className="px-3 py-2 border-b border-[#30363d]">
                    <p className="text-sm font-semibold text-[#e6edf3] truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-[#8b949e] truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#e6edf3] hover:bg-[#21262d] transition-colors"
                  >
                    <User size={14} /> Mon profil
                  </Link>
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
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm font-medium text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-md transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
