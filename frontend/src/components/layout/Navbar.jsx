import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, LogOut, User, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-950/95 backdrop-blur-md border-b border-white/5 flex items-center lg:pl-64">
      <div className="flex items-center justify-between w-full px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          {user && (
            <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-xl hover:bg-white/8 text-slate-500 transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          {!user && (
            <Link to="/" className="flex items-center gap-2.5">
              <div className="size-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">QuartierLink</span>
            </Link>
          )}
        </div>

        {/* Right */}
        {user ? (
          <div className="flex items-center gap-1">
            <Link to="/messages" className="p-2 rounded-xl hover:bg-white/8 text-slate-500 hover:text-indigo-400 transition-colors">
              <MessageSquare size={19} />
            </Link>
            <button className="relative p-2 rounded-xl hover:bg-white/8 text-slate-500 hover:text-indigo-400 transition-colors">
              <Bell size={19} />
              <span className="absolute top-2 right-2 size-1.5 bg-red-500 rounded-full" />
            </button>

            <div className="relative ml-1" ref={dropRef}>
              <button onClick={() => setDropOpen(!dropOpen)} className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-white/8 transition-colors">
                <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                <span className="text-sm font-medium text-slate-300 hidden sm:block">{user.firstName}</span>
                <ChevronDown size={14} className="text-slate-600 hidden sm:block" />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 rounded-2xl shadow-2xl border border-white/8 py-2 z-50">
                  <div className="px-4 py-2.5 mb-1">
                    <p className="text-sm font-semibold text-white">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="h-px bg-white/5 mx-2 mb-1" />
                  <Link to="/profile" onClick={() => setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-indigo-400 transition-colors">
                    <User size={15} /> Mon profil
                  </Link>
                  <div className="h-px bg-white/5 mx-2 my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut size={15} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Connexion</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl transition-all shadow-sm shadow-indigo-500/30">
              S'inscrire
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
