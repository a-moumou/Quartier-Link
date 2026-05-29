import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-300">{label}</label>
    {children}
  </div>
);

const DarkInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Icon size={16} /></span>}
    <input
      className={['w-full py-3 bg-slate-800 border border-white/8 text-white placeholder:text-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all', Icon ? 'pl-10 pr-4' : 'px-4'].join(' ')}
      {...props}
    />
  </div>
);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', address: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (form.password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (form.password !== form.confirm) return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, address: form.address, password: form.password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-violet-600/12 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="size-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="font-bold text-white text-xl tracking-tight">QuartierLink</span>
          </Link>
          <h1 className="mt-7 text-3xl font-bold text-white tracking-tight">Créer un compte</h1>
          <p className="mt-2 text-sm text-slate-400">Rejoignez votre communauté de quartier</p>
        </div>

        <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom"><DarkInput icon={User} type="text" placeholder="Jean" value={form.firstName} onChange={set('firstName')} required /></Field>
              <Field label="Nom"><DarkInput type="text" placeholder="Dupont" value={form.lastName} onChange={set('lastName')} required /></Field>
            </div>
            <Field label="Adresse e-mail"><DarkInput icon={Mail} type="email" placeholder="vous@exemple.fr" value={form.email} onChange={set('email')} required autoComplete="email" /></Field>
            <Field label="Adresse postale"><DarkInput icon={MapPin} type="text" placeholder="12 rue de la Paix, Paris" value={form.address} onChange={set('address')} required /></Field>

            <Field label="Mot de passe">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Lock size={16} /></span>
                <input type={showPw ? 'text' : 'password'} placeholder="8 caractères minimum" value={form.password} onChange={set('password')} required
                  className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-white/8 text-white placeholder:text-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirmer le mot de passe">
              <DarkInput icon={Lock} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
            </Field>

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Créer mon compte
            </Button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-5">
            En créant un compte, vous acceptez nos{' '}
            <a href="#" className="text-indigo-400 hover:underline">CGU</a> et notre{' '}
            <a href="#" className="text-indigo-400 hover:underline">politique de confidentialité</a>.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
