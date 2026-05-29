import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Shield, Lock, Mail, Calendar, MapPin, Save, FileCheck, Upload, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../services/api';

const TABS = [
  { key: 'info',         label: 'Informations',    icon: User      },
  { key: 'verification', label: 'Vérification',    icon: FileCheck },
  { key: 'security',     label: 'Sécurité',        icon: Shield    },
  { key: 'privacy',      label: 'Confidentialité', icon: Lock      },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('info');

  const [infoForm, setInfoForm] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', address: '' });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');
  const [currentAddress, setCurrentAddress] = useState(user?.adresse ?? user?.address ?? null);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const [privacy, setPrivacy] = useState({ showProfile: true, receiveMessages: true, emailNotifications: true });

  const [proofUrl, setProofUrl]         = useState(null);
  const [verifStatus, setVerifStatus]   = useState(user?.statutVerification ?? 'NON_VERIFIE');
  const [proofLoading, setProofLoading] = useState(false);
  const [proofMsg, setProofMsg]         = useState('');
  const [proofError, setProofError]     = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/user/me').then((res) => {
      const addr = res.data.adresse ?? res.data.address ?? '';
      setCurrentAddress(addr || null);
      setInfoForm((f) => ({ ...f, firstName: res.data.firstName ?? f.firstName, lastName: res.data.lastName ?? f.lastName, address: addr }));
      setProofUrl(res.data.proofUrl ?? null);
      setVerifStatus(res.data.statutVerification ?? 'NON_VERIFIE');
    }).catch(() => {});
  }, []);

  const setInfo = (k) => (e) => setInfoForm((f) => ({ ...f, [k]: e.target.value }));
  const setPw   = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const saveInfo = async (e) => {
    e.preventDefault();
    setInfoLoading(true); setInfoMsg('');
    try {
      const res = await api.put('/user/profile', infoForm);
      updateUser(res.data);
      setCurrentAddress(res.data.adresse ?? res.data.address ?? null);
      setInfoMsg('Informations mises à jour avec succès.');
    } catch { setInfoMsg('Erreur lors de la mise à jour.'); }
    finally { setInfoLoading(false); }
  };

  const savePw = async (e) => {
    e.preventDefault(); setPwError(''); setPwMsg('');
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas.'); return; }
    if (pwForm.next.length < 8) { setPwError('Minimum 8 caractères.'); return; }
    setPwLoading(true);
    try {
      await api.put('/user/password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwMsg('Mot de passe modifié avec succès.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) { setPwError(err.response?.data?.message || 'Mot de passe actuel incorrect.'); }
    finally { setPwLoading(false); }
  };

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState('');

  const deleteAccount = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.')) return;
    setDeleteLoading(true); setDeleteError('');
    try {
      await api.delete('/user/account');
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err.response?.data?.message ?? 'Erreur lors de la suppression.');
      setDeleteLoading(false);
    }
  };

  const uploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofLoading(true); setProofMsg(''); setProofError('');
    const form = new FormData();
    form.append('proof', file);
    try {
      const res = await api.post('/user/upload-proof', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProofUrl(res.data.proofUrl ?? null);
      setVerifStatus('EN_ATTENTE');
      setProofMsg('Justificatif envoyé. Votre dossier est en cours de vérification.');
    } catch (err) {
      setProofError(err.response?.data?.message ?? 'Erreur lors de l\'envoi.');
    } finally {
      setProofLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const fullName  = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin quartier' : 'Membre';
  const roleBadge = user?.role === 'super_admin' ? 'purple' : user?.role === 'admin' ? 'info' : 'default';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Mon profil</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez vos informations et préférences</p>
      </div>

      {/* Profile card */}
      <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar name={fullName} size="xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{fullName}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
              <Mail size={13} /> {user?.email}
            </div>
            {currentAddress && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                <MapPin size={13} /> {currentAddress}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={roleBadge}>{roleLabel}</Badge>
              {user?.isVerified ? <Badge variant="success">Vérifié</Badge> : <Badge variant="warning">En attente</Badge>}
            </div>
            {user?.createdAt && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                <Calendar size={12} />
                Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={['flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors', tab === key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-white hover:border-white/10'].join(' ')}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'info' && (
        <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
          <h3 className="text-base font-semibold text-white mb-5">Informations personnelles</h3>
          {infoMsg && (
            <div className={['mb-4 px-4 py-3 rounded-xl text-sm', infoMsg.includes('succès') ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300' : 'bg-red-500/10 border border-red-500/20 text-red-400'].join(' ')}>
              {infoMsg}
            </div>
          )}
          <form onSubmit={saveInfo} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" type="text" value={infoForm.firstName} onChange={setInfo('firstName')} required />
              <Input label="Nom"    type="text" value={infoForm.lastName}  onChange={setInfo('lastName')}  required />
            </div>
            <Input label="Adresse e-mail" type="email" value={user?.email ?? ''} disabled icon={Mail} hint="L'adresse e-mail ne peut pas être modifiée." />
            <Input
              label="Adresse postale"
              type="text"
              value={currentAddress ? currentAddress : infoForm.address}
              onChange={currentAddress ? undefined : setInfo('address')}
              disabled={!!currentAddress}
              icon={MapPin}
              placeholder="Votre adresse"
              hint={currentAddress ? "L'adresse ne peut plus être modifiée après enregistrement." : undefined}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={infoLoading} size="sm"><Save size={14} /> Enregistrer</Button>
            </div>
          </form>
        </div>
      )}

      {tab === 'verification' && (
        <div className="space-y-4">
          {/* Statut actuel */}
          <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
            <h3 className="text-base font-semibold text-white mb-4">Statut de vérification</h3>
            {verifStatus === 'VERIFIE' && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Compte vérifié</p>
                  <p className="text-xs text-emerald-500 mt-0.5">Votre identité a été validée par un administrateur.</p>
                </div>
              </div>
            )}
            {verifStatus === 'EN_ATTENTE' && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Clock size={20} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Vérification en cours</p>
                  <p className="text-xs text-amber-500 mt-0.5">Votre justificatif est en cours d'examen. Vous serez notifié dès validation.</p>
                </div>
              </div>
            )}
            {verifStatus === 'NON_VERIFIE' && (
              <div className="flex items-center gap-3 p-4 bg-slate-800 border border-white/8 rounded-xl">
                <XCircle size={20} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-300">Non vérifié</p>
                  <p className="text-xs text-slate-500 mt-0.5">Envoyez un justificatif de domicile pour vérifier votre identité.</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload justificatif */}
          {verifStatus !== 'VERIFIE' && (
            <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
              <h3 className="text-base font-semibold text-white mb-1">
                {proofUrl ? 'Remplacer le justificatif' : 'Envoyer un justificatif'}
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Pièce d'identité, quittance de loyer ou facture récente. JPG, PNG ou PDF — 5 Mo max.
              </p>

              {proofMsg && (
                <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300">
                  {proofMsg}
                </div>
              )}
              {proofError && (
                <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {proofError}
                </div>
              )}

              {proofUrl && (
                <div className="mb-4 p-3 bg-slate-800 rounded-xl flex items-center gap-3">
                  <FileCheck size={16} className="text-indigo-400 shrink-0" />
                  <a
                    href={`http://localhost:8000${proofUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-indigo-400 hover:text-indigo-300 underline truncate"
                  >
                    Voir le justificatif envoyé
                  </a>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={uploadProof}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                loading={proofLoading}
                size="sm"
                variant={proofUrl ? 'secondary' : 'primary'}
              >
                <Upload size={14} />
                {proofUrl ? 'Remplacer le fichier' : 'Choisir un fichier'}
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === 'security' && (
        <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
          <h3 className="text-base font-semibold text-white mb-5">Changer le mot de passe</h3>
          {pwMsg   && <div className="mb-4 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300">{pwMsg}</div>}
          {pwError && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{pwError}</div>}
          <form onSubmit={savePw} className="space-y-4">
            <Input label="Mot de passe actuel"     type="password" value={pwForm.current}  onChange={setPw('current')}  required icon={Lock} placeholder="••••••••" />
            <Input label="Nouveau mot de passe"    type="password" value={pwForm.next}     onChange={setPw('next')}     required icon={Lock} placeholder="8 caractères minimum" />
            <Input label="Confirmer"               type="password" value={pwForm.confirm}  onChange={setPw('confirm')}  required icon={Lock} placeholder="••••••••" />
            <div className="flex items-center justify-between pt-2">
              <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Mot de passe oublié ?
              </Link>
              <Button type="submit" loading={pwLoading} size="sm"><Save size={14} /> Modifier</Button>
            </div>
          </form>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
            <h3 className="text-base font-semibold text-white mb-5">Préférences de confidentialité</h3>
            <div className="space-y-5">
              {[
                { key: 'showProfile',          label: 'Profil public',              desc: 'Les autres membres peuvent voir votre profil.' },
                { key: 'receiveMessages',       label: 'Recevoir des messages',      desc: 'Autorisez les voisins à vous envoyer des messages privés.' },
                { key: 'emailNotifications',    label: 'Notifications par e-mail',   desc: 'Recevez des alertes pour les nouvelles publications.' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setPrivacy((p) => ({ ...p, [key]: !p[key] }))}
                    style={{ width: 40, height: 22 }}
                    className={['relative rounded-full transition-colors shrink-0', privacy[key] ? 'bg-indigo-500' : 'bg-slate-700'].join(' ')}
                  >
                    <span
                      style={{ width: 18, height: 18, top: 2, transform: `translateX(${privacy[key] ? 20 : 2}px)` }}
                      className="absolute bg-white rounded-full shadow transition-transform"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
            <h3 className="text-base font-semibold text-red-400 mb-2">Zone de danger</h3>
            <p className="text-sm text-slate-500 mb-4">La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.</p>
            {deleteError && (
              <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{deleteError}</div>
            )}
            <Button variant="danger" size="sm" loading={deleteLoading} onClick={deleteAccount}>Supprimer mon compte</Button>
          </div>
        </div>
      )}
    </div>
  );
}
