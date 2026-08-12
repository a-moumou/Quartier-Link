import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user?.isVerified ? '/dashboard' : '/upload-proof', { replace: true });
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md ql-fade-up">
        <div className="flex justify-center mb-8">
          <Logo to="/" size="md" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-7 shadow-xl shadow-black/30">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[#e6edf3]">Bon retour</h1>
            <p className="mt-1 text-sm text-[#8b949e]">Connectez-vous à votre compte</p>
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#e6edf3]">Adresse e-mail</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  placeholder="vous@exemple.fr"
                  value={form.email}
                  onChange={set('email')}
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0f1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 hover:border-[#484f58] transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#e6edf3]">Mot de passe</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none">
                  <Lock size={15} />
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-9 py-2.5 bg-[#0f1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 hover:border-[#484f58] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e7681] hover:text-[#e6edf3] transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Se connecter <ArrowRight size={14} />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#8b949e] mt-6">
          Pas encore de compte ?{' '}
          <Link
            to="/register"
            className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
