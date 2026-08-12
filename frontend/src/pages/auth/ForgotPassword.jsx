import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/Logo';
import api from '../../services/api';

function StyledInput({ icon: Icon, ...props }) {
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
        ].join(' ')}
        {...props}
      />
    </div>
  );
}

export default function ForgotPassword() {
  const [step, setStep]       = useState('email');
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');

  const sendCode = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMsg('Un code à 6 chiffres a été envoyé à votre adresse email.');
      setStep('code');
    } catch { setError('Une erreur est survenue.'); }
    finally { setLoading(false); }
  };

  const resetPw = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 8)  { setError('Minimum 8 caractères.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, password });
      setMsg('Mot de passe réinitialisé ! Vous pouvez maintenant vous connecter.');
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Code invalide ou expiré.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md ql-fade-up">
        <div className="flex justify-center mb-8">
          <Logo to="/" size="md" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-7 shadow-xl shadow-black/30">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[#e6edf3]">Mot de passe oublié</h1>
            <p className="mt-1 text-sm text-[#8b949e]">
              {step === 'email' && 'Recevez un code de vérification par email.'}
              {step === 'code'  && 'Entrez le code reçu et un nouveau mot de passe.'}
              {step === 'done'  && 'Votre mot de passe a été réinitialisé.'}
            </p>
          </div>

          {msg && (
            <div className="mb-5 px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-sm text-emerald-400">
              {msg}
            </div>
          )}
          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={sendCode} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#e6edf3]">Adresse e-mail</label>
                <StyledInput icon={Mail} type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">Envoyer le code</Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={resetPw} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#e6edf3]">Code à 6 chiffres</label>
                <StyledInput
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#e6edf3]">Nouveau mot de passe</label>
                <StyledInput icon={Lock} type="password" placeholder="8 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#e6edf3]">Confirmer</label>
                <StyledInput icon={Lock} type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">Réinitialiser le mot de passe</Button>
              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); }}
                className="w-full text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors mt-1"
              >
                Renvoyer un nouveau code
              </button>
            </form>
          )}

          {step === 'done' && (
            <Link to="/login">
              <Button fullWidth size="lg">Se connecter</Button>
            </Link>
          )}
        </div>

        <p className="text-center text-sm text-[#8b949e] mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft size={13} /> Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
