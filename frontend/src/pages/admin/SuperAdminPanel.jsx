import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Users, MapPin, FileText, ShieldAlert, Edit3, ExternalLink } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
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

export default function SuperAdminPanel() {
  const [tab, setTab] = useState('proofs');
  const [proofs, setProofs] = useState([]);
  const [quartiers, setQuartiers] = useState([]);
  const [quartierUpdates, setQuartierUpdates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [prRes, qRes, uRes, quRes] = await Promise.all([
          api.get('/super-admin/proofs'),
          api.get('/super-admin/quartiers'),
          api.get('/super-admin/users'),
          api.get('/super-admin/quartier-updates'),
        ]);
        setProofs(prRes.data);
        setQuartiers(qRes.data);
        setUsers(uRes.data);
        setQuartierUpdates(quRes.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleProof         = async (id, a) => { setActing(id+a); try { await api.put(`/super-admin/proofs/${id}/${a}`);           setProofs((p)          => p.filter((x) => x.id !== id)); } catch {} finally { setActing(null); } };
  const handleQuartier      = async (id, a) => { setActing(id+a); try { await api.put(`/super-admin/quartiers/${id}/${a}`);        setQuartiers((p)       => p.filter((x) => x.id !== id)); } catch {} finally { setActing(null); } };
  const handleQuartierUpdate = async (id, a) => { setActing(id+a); try { await api.put(`/super-admin/quartier-updates/${id}/${a}`); setQuartierUpdates((p) => p.filter((x) => x.id !== id)); } catch {} finally { setActing(null); } };

  const ActionButtons = ({ id, onAction }) => (
    <div className="flex items-center gap-2 shrink-0">
      <Button variant="secondary" size="sm" loading={acting === id + 'reject'}  disabled={!!acting} onClick={() => onAction(id, 'reject')}>
        <XCircle size={14} /> Refuser
      </Button>
      <Button size="sm" loading={acting === id + 'approve'} disabled={!!acting} onClick={() => onAction(id, 'approve')}>
        <CheckCircle size={14} /> Valider
      </Button>
    </div>
  );

  const EmptyState = () => (
    <div className="bg-slate-900 rounded-2xl border border-white/8 p-12 text-center">
      <CheckCircle size={36} className="text-slate-700 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">Tout est à jour</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="size-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-violet-500/30">
          <ShieldAlert size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Administration générale</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion globale de la plateforme QuartierLink</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Justificatifs en attente"   value={loading ? '—' : proofs.length}          icon={FileText} gradient="from-amber-400 to-orange-500"  />
        <StatCard label="Quartiers total"               value={loading ? '—' : quartiers.length}       icon={MapPin}   gradient="from-violet-500 to-purple-600" />
        <StatCard label="Modifs. en attente"          value={loading ? '—' : quartierUpdates.length} icon={Edit3}    gradient="from-rose-400 to-pink-500"     />
        <StatCard label="Utilisateurs inscrits"       value={loading ? '—' : users.length}           icon={Users}    gradient="from-indigo-500 to-blue-500"   />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex">
          {[
            { key: 'proofs',          label: `Justificatifs (${proofs.length})`,            icon: FileText },
            { key: 'quartiers',       label: `Quartiers (${quartiers.length})`,             icon: MapPin   },
            { key: 'quartierUpdates', label: `Modifications (${quartierUpdates.length})`,   icon: Edit3    },
            { key: 'users',           label: `Utilisateurs (${users.length})`,              icon: Users    },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={['flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors', tab === key ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-white hover:border-white/10'].join(' ')}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Justificatifs */}
      {tab === 'proofs' && (
        loading ? <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-slate-900 rounded-2xl border border-white/8 p-5 h-20 animate-pulse" />)}</div>
        : proofs.length === 0 ? <EmptyState />
        : (
          <div className="space-y-3">
            {proofs.map((p) => {
              const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
              return (
                <div key={p.id} className="bg-slate-900 rounded-2xl border border-white/8 p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-white">{name}</p>
                        <p className="text-xs text-slate-500">{p.email}</p>
                        {p.address && <p className="text-xs text-slate-500">{p.address}</p>}
                        {p.proofUrl && (
                          <a
                            href={`http://localhost:8000${p.proofUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                          >
                            <ExternalLink size={11} /> Voir le justificatif
                          </a>
                        )}
                        {!p.proofUrl && (
                          <p className="text-xs text-slate-600 mt-1 italic">Aucun document fourni</p>
                        )}
                      </div>
                    </div>
                    <ActionButtons id={p.id} onAction={handleProof} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Quartiers */}
      {tab === 'quartiers' && (
        loading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-slate-900 rounded-2xl border border-white/8 p-5 h-24 animate-pulse" />)}</div>
        : (() => {
            const pending  = quartiers.filter((q) => q.status === 'EN_ATTENTE');
            const resolved = quartiers.filter((q) => q.status !== 'EN_ATTENTE');

            const QuartierCard = ({ q, showActions }) => {
              const creator = q.creator ?? q.createur;
              const cName = `${creator?.firstName ?? ''} ${creator?.lastName ?? ''}`.trim();
              const nom = q.name ?? q.nom;
              const isRejected = q.status === 'REJETE';
              return (
                <div className="bg-slate-900 rounded-2xl border border-white/8 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="size-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                        <span className="text-white font-bold text-sm">{nom?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{nom}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><MapPin size={11} /> {q.address ?? q.adresse}</div>
                        {q.description && <p className="text-xs text-slate-400 mt-1 max-w-sm line-clamp-2">{q.description}</p>}
                        {cName && (
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar name={cName} size="xs" />
                            <span className="text-xs text-slate-500">Par {cName} — {creator?.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!showActions && (
                        <span className={['text-[10px] font-semibold px-2 py-0.5 rounded-full', isRejected ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'].join(' ')}>
                          {isRejected ? 'Rejeté' : 'Actif'}
                        </span>
                      )}
                      {showActions && <ActionButtons id={q.id} onAction={handleQuartier} />}
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-8">
                {/* Section : en attente */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">
                    En attente de validation ({pending.length})
                  </h2>
                  {pending.length === 0
                    ? <p className="text-sm text-slate-600 px-1">Aucun quartier en attente.</p>
                    : <div className="space-y-3">{pending.map((q) => <QuartierCard key={q.id} q={q} showActions />)}</div>
                  }
                </div>

                {/* Section : déjà traités */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                    Tous les quartiers ({resolved.length})
                  </h2>
                  {resolved.length === 0
                    ? <p className="text-sm text-slate-600 px-1">Aucun quartier traité.</p>
                    : <div className="space-y-3">{resolved.map((q) => <QuartierCard key={q.id} q={q} showActions={false} />)}</div>
                  }
                </div>
              </div>
            );
          })()
      )}

      {/* Modifications en attente */}
      {tab === 'quartierUpdates' && (
        loading ? <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-slate-900 rounded-2xl border border-white/8 p-5 h-28 animate-pulse" />)}</div>
        : quartierUpdates.length === 0 ? <EmptyState />
        : (
          <div className="space-y-3">
            {quartierUpdates.map((q) => {
              const adminName = `${q.admin?.firstName ?? ''} ${q.admin?.lastName ?? ''}`.trim();
              return (
                <div key={q.id} className="bg-slate-900 rounded-2xl border border-white/8 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Quartier #{q.id}</p>
                      {adminName && <p className="text-xs text-slate-500">Admin : {adminName} — {q.admin?.email}</p>}
                    </div>
                    <ActionButtons id={q.id} onAction={handleQuartierUpdate} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/60 rounded-xl p-3 space-y-1">
                      <p className="text-slate-500 font-medium uppercase tracking-wide text-[10px]">Actuel</p>
                      <p className="text-white font-medium">{q.currentName}</p>
                      {q.currentDescription && <p className="text-slate-400 line-clamp-2">{q.currentDescription}</p>}
                      {q.currentAddress && <p className="text-slate-500 flex items-center gap-1"><MapPin size={10} />{q.currentAddress}</p>}
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 space-y-1">
                      <p className="text-indigo-400 font-medium uppercase tracking-wide text-[10px]">Proposé</p>
                      <p className="text-white font-medium">{q.pendingName}</p>
                      {q.pendingDescription && <p className="text-slate-300 line-clamp-2">{q.pendingDescription}</p>}
                      {q.pendingAddress && <p className="text-indigo-300 flex items-center gap-1"><MapPin size={10} />{q.pendingAddress}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Utilisateurs */}
      {tab === 'users' && (
        <div className="bg-slate-900 rounded-2xl border border-white/8 divide-y divide-white/5">
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-slate-800 rounded-xl" />)}</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-600">Aucun utilisateur.</div>
          ) : users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-4">
              <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                {u.quartiers?.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    <MapPin size={10} className="text-slate-600 shrink-0" />
                    {u.quartiers.map((q) => (
                      <span key={q.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-medium">
                        {q.name}
                      </span>
                    ))}
                  </div>
                )}
                {(!u.quartiers || u.quartiers.length === 0) && (
                  <p className="text-[10px] text-slate-600 mt-0.5">Aucun quartier</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.role === 'ADMIN_GENERAL'  && <Badge variant="purple">Super Admin</Badge>}
                {u.role === 'ADMIN_QUARTIER' && <Badge variant="info">Admin quartier</Badge>}
                {(u.status ?? u.statutVerification) === 'VERIFIE'
                  ? <Badge variant="success">Vérifié</Badge>
                  : (u.status ?? u.statutVerification) === 'EN_ATTENTE'
                    ? <Badge variant="warning">En attente</Badge>
                    : <Badge variant="default">Non vérifié</Badge>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
