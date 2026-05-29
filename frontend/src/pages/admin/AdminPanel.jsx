import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Users, Clock, UserX, MapPin, Save, Building2, ShieldCheck, ShieldOff } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../services/api';

function StatCard({ label, value, icon: Icon, gradient }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-white/8 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [quartier, setQuartier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const [editForm, setEditForm] = useState({ name: '', description: '', address: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, reqRes, memRes] = await Promise.all([api.get('/admin/quartier'), api.get('/admin/join-requests'), api.get('/admin/members')]);
        setQuartier(qRes.data);
        setEditForm({ name: qRes.data.name ?? '', description: qRes.data.description ?? '', address: qRes.data.address ?? qRes.data.adresse ?? '' });
        setRequests(reqRes.data);
        setMembers(memRes.data.members ?? memRes.data);
        setIsCreator(memRes.data.isCreator ?? false);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleRequest = async (id, action) => {
    setActing(id + action);
    try {
      await api.put(`/admin/join-requests/${id}/${action}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ }
    finally { setActing(null); }
  };

  const saveQuartier = async (e) => {
    e.preventDefault();
    setEditLoading(true); setEditMsg('');
    try {
      const res = await api.put('/admin/quartier', editForm);
      setQuartier(res.data);
      setEditMsg('pending');
    } catch { setEditMsg('error'); }
    finally { setEditLoading(false); }
  };

  const exclude = async (userId) => {
    setActing('x' + userId);
    try {
      await api.delete(`/admin/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user?.id !== userId));
    } catch { /* ignore */ }
    finally { setActing(null); }
  };

  const promote = async (userId) => {
    setActing('p' + userId);
    try {
      await api.put(`/admin/members/${userId}/promote`);
      setMembers((prev) => prev.map((m) => m.user?.id === userId ? { ...m, role: 'ADMIN' } : m));
    } catch { /* ignore */ }
    finally { setActing(null); }
  };

  const demote = async (userId) => {
    setActing('d' + userId);
    try {
      await api.put(`/admin/members/${userId}/demote`);
      setMembers((prev) => prev.map((m) => m.user?.id === userId ? { ...m, role: 'MEMBRE' } : m));
    } catch { /* ignore */ }
    finally { setActing(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Administration</h1>
        <p className="text-sm text-slate-500 mt-1">{quartier ? `Quartier « ${quartier.nom} »` : 'Gérez votre quartier'}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Demandes en attente" value={loading ? '—' : requests.length} icon={Clock}        gradient="from-amber-400 to-orange-500" />
        <StatCard label="Membres actifs"       value={loading ? '—' : members.length}  icon={Users}       gradient="from-indigo-500 to-violet-600" />
        <StatCard label="Statut"               value="Actif"                           icon={CheckCircle} gradient="from-emerald-400 to-teal-500"  />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex">
          {[
            { key: 'requests', label: `Demandes (${requests.length})` },
            { key: 'members',  label: `Membres (${members.length})` },
            { key: 'quartier', label: 'Mon quartier' },
          ].map((t) => (
            <button key={t.key} onClick={() => {
              setTab(t.key);
              if (t.key === 'quartier' && quartier) {
                setEditForm({
                  name:        quartier.name ?? quartier.nom ?? '',
                  description: quartier.description ?? '',
                  address:     quartier.address ?? quartier.adresse ?? '',
                });
                setEditMsg('');
              }
            }}
              className={['px-5 py-3 text-sm font-medium border-b-2 transition-colors', tab === t.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-white hover:border-white/10'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'requests' && (
        loading ? <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-slate-900 rounded-2xl border border-white/8 p-5 h-20 animate-pulse" />)}</div>
        : requests.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-white/8 p-12 text-center">
            <CheckCircle size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const name = `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim();
              return (
                <div key={r.id} className="bg-slate-900 rounded-2xl border border-white/8 p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-white">{name}</p>
                        <p className="text-xs text-slate-500">{r.user?.email}</p>
                        {r.user?.adresse && <p className="text-xs text-slate-500">{r.user.adresse}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" loading={acting === r.id + 'reject'} disabled={!!acting} onClick={() => handleRequest(r.id, 'reject')}>
                        <XCircle size={14} /> Refuser
                      </Button>
                      <Button size="sm" loading={acting === r.id + 'approve'} disabled={!!acting} onClick={() => handleRequest(r.id, 'approve')}>
                        <CheckCircle size={14} /> Accepter
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'quartier' && (
        loading ? (
          <div className="bg-slate-900 rounded-2xl border border-white/8 p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-slate-800 rounded w-1/3" />
            <div className="h-10 bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-800 rounded-xl" />
            <div className="h-10 bg-slate-800 rounded-xl" />
          </div>
        ) : !quartier ? (
          <div className="bg-slate-900 rounded-2xl border border-white/8 p-12 text-center">
            <Building2 size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucun quartier administré trouvé.</p>
          </div>
        ) : (
        <div className="bg-slate-900 rounded-2xl border border-white/8 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/8">
            <div className="size-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white">{quartier.name ?? quartier.nom}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {quartier.status === 'EN_ATTENTE' ? (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Clock size={11} /> En attente de validation
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle size={11} /> Actif
                  </span>
                )}
              </div>
            </div>
          </div>

          {(quartier.hasPendingUpdate || editMsg === 'pending') && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
              <Clock size={15} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Modifications en attente de validation par le super-admin</p>
                {quartier.hasPendingUpdate && (
                  <ul className="text-xs text-amber-400 space-y-0.5">
                    {quartier.pendingName        && quartier.pendingName        !== quartier.name        && <li>Nom : <span className="line-through opacity-60">{quartier.name}</span> → <strong>{quartier.pendingName}</strong></li>}
                    {quartier.pendingDescription !== undefined && quartier.pendingDescription !== quartier.description && <li>Description modifiée</li>}
                    {quartier.pendingAddress     !== undefined && quartier.pendingAddress     !== quartier.address     && <li>Adresse : <span className="line-through opacity-60">{quartier.address}</span> → <strong>{quartier.pendingAddress}</strong></li>}
                  </ul>
                )}
              </div>
            </div>
          )}
          {editMsg === 'error' && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              Erreur lors de la mise à jour.
            </div>
          )}

          <form onSubmit={saveQuartier} className="space-y-4">
            <Input
              label="Nom du quartier"
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Décrivez votre quartier..."
                className="w-full resize-none text-sm text-white placeholder:text-slate-600 bg-slate-800 rounded-xl border border-white/8 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <Input
              label="Adresse"
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
              icon={MapPin}
              placeholder="Adresse du quartier"
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={editLoading} size="sm">
                <Save size={14} /> Enregistrer
              </Button>
            </div>
          </form>
        </div>
        )
      )}

      {tab === 'members' && (
        <div className="bg-slate-900 rounded-2xl border border-white/8 divide-y divide-white/5">
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-800 rounded-xl" />)}</div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-600">Aucun membre.</div>
          ) : members.map((m) => {
            const isCreateur = m.role === 'CREATEUR';
            const isAdmin    = m.role === 'ADMIN';
            const fullName   = `${m.user?.firstName ?? ''} ${m.user?.lastName ?? ''}`.trim();
            const uid        = m.user?.id;
            return (
              <div key={m.membershipId} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={fullName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{fullName}</p>
                  <p className="text-xs text-slate-500">{m.user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isCreateur && <Badge variant="primary">Créateur</Badge>}
                  {isAdmin    && <Badge variant="info">Co-admin</Badge>}
                  {/* Seul le créateur peut promouvoir / rétrograder / exclure */}
                  {isCreator && !isCreateur && (
                    <>
                      {!isAdmin ? (
                        <Button variant="ghost" size="xs" loading={acting === 'p' + uid} disabled={!!acting}
                          onClick={() => promote(uid)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          title="Promouvoir co-admin">
                          <ShieldCheck size={14} />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="xs" loading={acting === 'd' + uid} disabled={!!acting}
                          onClick={() => demote(uid)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          title="Retirer le rôle admin">
                          <ShieldOff size={14} />
                        </Button>
                      )}
                      <Button variant="ghost" size="xs" loading={acting === 'x' + uid} disabled={!!acting}
                        onClick={() => exclude(uid)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <UserX size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
