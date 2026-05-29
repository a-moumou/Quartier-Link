import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';

const DarkInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Icon size={16} /></span>}
    <input
      className={['w-full py-3 bg-slate-800 border border-white/8 text-white placeholder:text-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all', Icon ? 'pl-10 pr-4' : 'px-4'].join(' ')}
      {...props}
    />
  </div>
);

export default function ForgotPassword() {
  const [step, setStep]       = useState('email'); // email | code
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
          <h1 className="mt-7 text-3xl font-bold text-white tracking-tight">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === 'email' && 'Entrez votre email pour recevoir un code de vérification.'}
            {step === 'code'  && 'Entrez le code reçu par email et votre nouveau mot de passe.'}
            {step === 'done'  && 'Votre mot de passe a été réinitialisé.'}
          </p>
        </div>

        <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
          {msg && (
            <div className="mb-5 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300">{msg}</div>
          )}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
          )}

          {step === 'email' && (
            <form onSubmit={sendCode} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Adresse e-mail</label>
                <DarkInput icon={Mail} type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">Envoyer le code</Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={resetPw} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Code à 6 chiffres</label>
                <DarkInput type="text" placeholder="123456" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Nouveau mot de passe</label>
                <DarkInput icon={Lock} type="password" placeholder="8 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Confirmer</label>
                <DarkInput icon={Lock} type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">Réinitialiser le mot de passe</Button>
              <button type="button" onClick={() => { setStep('email'); setError(''); }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1">
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

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
