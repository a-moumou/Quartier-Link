import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Users, Clock, UserX, MapPin, Save,
  Building2, ShieldCheck, ShieldOff,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../services/api';

function StatCard({ label, value, icon: Icon, tone = 'emerald' }) {
  const tones = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
    indigo:  'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  };
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-[#e6edf3] mt-1">{value}</p>
        </div>
        <div className={['size-9 rounded-md border flex items-center justify-center', tones[tone]].join(' ')}>
          <Icon size={16} />
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
        const [qRes, reqRes, memRes] = await Promise.all([
          api.get('/admin/quartier'),
          api.get('/admin/join-requests'),
          api.get('/admin/members'),
        ]);
        setQuartier(qRes.data);
        setEditForm({
          name: qRes.data.name ?? '',
          description: qRes.data.description ?? '',
          address: qRes.data.address ?? qRes.data.adresse ?? '',
        });
        setRequests(reqRes.data);
        setMembers(memRes.data.members ?? memRes.data);
        setIsCreator(memRes.data.isCreator ?? false);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleRequest = async (id, action) => {
    setActing(id + action);
    try {
      await api.put(`/admin/join-requests/${id}/${action}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ } finally { setActing(null); }
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
    } catch { /* ignore */ } finally { setActing(null); }
  };

  const promote = async (userId) => {
    setActing('p' + userId);
    try {
      await api.put(`/admin/members/${userId}/promote`);
      setMembers((prev) => prev.map((m) => m.user?.id === userId ? { ...m, role: 'ADMIN' } : m));
    } catch { /* ignore */ } finally { setActing(null); }
  };

  const demote = async (userId) => {
    setActing('d' + userId);
    try {
      await api.put(`/admin/members/${userId}/demote`);
      setMembers((prev) => prev.map((m) => m.user?.id === userId ? { ...m, role: 'MEMBRE' } : m));
    } catch { /* ignore */ } finally { setActing(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Administration</h1>
        <p className="text-sm text-[#8b949e] mt-1">
          {quartier ? `Quartier « ${quartier.nom ?? quartier.name} »` : 'Gérez votre quartier'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Demandes en attente" value={loading ? '—' : requests.length} icon={Clock}       tone="amber" />
        <StatCard label="Membres actifs"      value={loading ? '—' : members.length}  icon={Users}       tone="emerald" />
        <StatCard label="Statut"              value="Actif"                            icon={CheckCircle} tone="emerald" />
      </div>

      <div className="border-b border-[#30363d] overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {[
            { key: 'requests', label: `Demandes (${requests.length})` },
            { key: 'members',  label: `Membres (${members.length})` },
            { key: 'quartier', label: 'Mon quartier' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
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
              className={[
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'requests' && (
        loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
            <CheckCircle size={32} className="text-[#6e7681] mx-auto mb-3" />
            <p className="text-[#e6edf3] font-medium">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const name = `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim();
              return (
                <div key={r.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-[#e6edf3]">{name}</p>
                        <p className="text-xs text-[#8b949e]">{r.user?.email}</p>
                        {r.user?.adresse && (
                          <p className="text-xs text-[#8b949e] flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {r.user.adresse}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={acting === r.id + 'reject'}
                        disabled={!!acting}
                        onClick={() => handleRequest(r.id, 'reject')}
                      >
                        <XCircle size={13} /> Refuser
                      </Button>
                      <Button
                        size="sm"
                        loading={acting === r.id + 'approve'}
                        disabled={!!acting}
                        onClick={() => handleRequest(r.id, 'approve')}
                      >
                        <CheckCircle size={13} /> Accepter
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
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-[#21262d] rounded w-1/3" />
            <div className="h-10 bg-[#21262d] rounded-md" />
            <div className="h-24 bg-[#21262d] rounded-md" />
            <div className="h-10 bg-[#21262d] rounded-md" />
          </div>
        ) : !quartier ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
            <Building2 size={32} className="text-[#6e7681] mx-auto mb-3" />
            <p className="text-[#e6edf3] font-medium">Aucun quartier administré trouvé.</p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#30363d]">
              <div className="size-10 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#e6edf3]">{quartier.name ?? quartier.nom}</h3>
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
              <div className="flex items-start gap-3 px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-sm text-amber-300">
                <Clock size={14} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Modifications en attente de validation par le super-admin</p>
                  {quartier.hasPendingUpdate && (
                    <ul className="text-xs text-amber-200/70 space-y-0.5">
                      {quartier.pendingName && quartier.pendingName !== quartier.name && (
                        <li>Nom : <span className="line-through opacity-60">{quartier.name}</span> → <strong>{quartier.pendingName}</strong></li>
                      )}
                      {quartier.pendingDescription !== undefined && quartier.pendingDescription !== quartier.description && (
                        <li>Description modifiée</li>
                      )}
                      {quartier.pendingAddress !== undefined && quartier.pendingAddress !== quartier.address && (
                        <li>Adresse : <span className="line-through opacity-60">{quartier.address}</span> → <strong>{quartier.pendingAddress}</strong></li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}
            {editMsg === 'error' && (
              <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400">
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
              <Input
                label="Description"
                textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez votre quartier..."
              />
              <Input
                label="Adresse"
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                icon={MapPin}
                placeholder="Adresse du quartier"
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={editLoading} size="md">
                  <Save size={13} /> Enregistrer
                </Button>
              </div>
            </form>
          </div>
        )
      )}

      {tab === 'members' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-[#21262d] rounded-md" />)}
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#8b949e]">Aucun membre.</div>
          ) : (
            <div className="divide-y divide-[#30363d]/80">
              {members.map((m) => {
                const isCreateur = m.role === 'CREATEUR';
                const isAdmin    = m.role === 'ADMIN';
                const fullName   = `${m.user?.firstName ?? ''} ${m.user?.lastName ?? ''}`.trim();
                const uid        = m.user?.id;
                return (
                  <div key={m.membershipId} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar name={fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e6edf3]">{fullName}</p>
                      <p className="text-xs text-[#8b949e]">{m.user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCreateur && <Badge variant="primary">Créateur</Badge>}
                      {isAdmin && <Badge variant="info">Co-admin</Badge>}
                      {isCreator && !isCreateur && (
                        <>
                          {!isAdmin ? (
                            <Button
                              variant="ghost"
                              size="xs"
                              loading={acting === 'p' + uid}
                              disabled={!!acting}
                              onClick={() => promote(uid)}
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              title="Promouvoir co-admin"
                            >
                              <ShieldCheck size={13} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="xs"
                              loading={acting === 'd' + uid}
                              disabled={!!acting}
                              onClick={() => demote(uid)}
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              title="Retirer le rôle admin"
                            >
                              <ShieldOff size={13} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="xs"
                            loading={acting === 'x' + uid}
                            disabled={!!acting}
                            onClick={() => exclude(uid)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <UserX size={13} />
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
      )}
    </div>
  );
}
