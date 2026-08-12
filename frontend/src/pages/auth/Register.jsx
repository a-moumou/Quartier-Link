import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/Logo';

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#e6edf3]">{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none">
          <Icon size={15} />
        </span>
      )}
      <input
        className={[
          'w-full py-2.5 bg-[#0f1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] rounded-md text-sm',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500',
          'hover:border-[#484f58] transition-colors',
          Icon ? 'pl-9 pr-3' : 'px-3',
          className,
        ].join(' ')}
        {...props}
      />
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', address: '', password: '', confirm: '',
  });
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
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        address: form.address,
        password: form.password,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-md ql-fade-up">
        <div className="flex justify-center mb-8">
          <Logo to="/" size="md" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-7 shadow-xl shadow-black/30">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[#e6edf3]">Créer un compte</h1>
            <p className="mt-1 text-sm text-[#8b949e]">Rejoignez votre réseau de voisinage</p>
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom">
                <StyledInput icon={User} type="text" placeholder="Jean" value={form.firstName} onChange={set('firstName')} required />
              </Field>
              <Field label="Nom">
                <StyledInput type="text" placeholder="Dupont" value={form.lastName} onChange={set('lastName')} required />
              </Field>
            </div>

            <Field label="Adresse e-mail">
              <StyledInput icon={Mail} type="email" placeholder="vous@exemple.fr" value={form.email} onChange={set('email')} required autoComplete="email" />
            </Field>

            <Field label="Adresse postale">
              <StyledInput icon={MapPin} type="text" placeholder="12 rue de la Paix, Paris" value={form.address} onChange={set('address')} required />
            </Field>

            <Field label="Mot de passe">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none">
                  <Lock size={15} />
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="8 caractères minimum"
                  value={form.password}
                  onChange={set('password')}
                  required
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
            </Field>

            <Field label="Confirmer">
              <StyledInput
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirm}
                onChange={set('confirm')}
                required
              />
            </Field>

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Créer mon compte <ArrowRight size={14} />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#8b949e] mt-6">
          Déjà inscrit ?{' '}
          <Link
            to="/login"
            className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
