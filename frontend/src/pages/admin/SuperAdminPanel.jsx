import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Users, MapPin, FileText,
  ShieldAlert, Edit3, ExternalLink,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
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
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleProof          = async (id, a) => { setActing(id+a); try { await api.put(`/super-admin/proofs/${id}/${a}`);            setProofs((p)          => p.filter((x) => x.id !== id)); } catch {} finally { setActing(null); } };
  const handleQuartier       = async (id, a) => { setActing(id+a); try { await api.put(`/super-admin/quartiers/${id}/${a}`);         setQuartiers((p)       => p.filter((x) => x.id !== id)); } catch {} finally { setActing(null); } };
  const handleQuartierUpdate = async (id, a) => { setActing(id+a); try { await api.put(`/super-admin/quartier-updates/${id}/${a}`);  setQuartierUpdates((p) => p.filter((x) => x.id !== id)); } catch {} finally { setActing(null); } };

  const ActionButtons = ({ id, onAction }) => (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="secondary"
        size="sm"
        loading={acting === id + 'reject'}
        disabled={!!acting}
        onClick={() => onAction(id, 'reject')}
      >
        <XCircle size={13} /> Refuser
      </Button>
      <Button
        size="sm"
        loading={acting === id + 'approve'}
        disabled={!!acting}
        onClick={() => onAction(id, 'approve')}
      >
        <CheckCircle size={13} /> Valider
      </Button>
    </div>
  );

  const EmptyState = () => (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
      <CheckCircle size={32} className="text-[#6e7681] mx-auto mb-3" />
      <p className="text-[#e6edf3] font-medium">Tout est à jour</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="size-11 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-center">
          <ShieldAlert size={20} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Administration générale</h1>
          <p className="text-sm text-[#8b949e] mt-1">Gestion globale de la plateforme QuartierLink</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Justificatifs en attente" value={loading ? '—' : proofs.length}         icon={FileText} tone="amber" />
        <StatCard label="Quartiers total"          value={loading ? '—' : quartiers.length}      icon={MapPin}   tone="emerald" />
        <StatCard label="Modifs. en attente"       value={loading ? '—' : quartierUpdates.length} icon={Edit3}    tone="amber" />
        <StatCard label="Utilisateurs inscrits"    value={loading ? '—' : users.length}          icon={Users}    tone="indigo" />
      </div>

      <div className="border-b border-[#30363d] overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {[
            { key: 'proofs',          label: `Justificatifs (${proofs.length})`,           icon: FileText },
            { key: 'quartiers',       label: `Quartiers (${quartiers.length})`,            icon: MapPin   },
            { key: 'quartierUpdates', label: `Modifications (${quartierUpdates.length})`,  icon: Edit3    },
            { key: 'users',           label: `Utilisateurs (${users.length})`,             icon: Users    },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tab === key
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]',
              ].join(' ')}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'proofs' && (
        loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : proofs.length === 0 ? <EmptyState /> : (
          <div className="space-y-3">
            {proofs.map((p) => {
              const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
              return (
                <div key={p.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-[#e6edf3]">{name}</p>
                        <p className="text-xs text-[#8b949e]">{p.email}</p>
                        {p.address && (
                          <p className="text-xs text-[#8b949e] flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {p.address}
                          </p>
                        )}
                        {p.proofUrl ? (
                          <a
                            href={`http://localhost:8000${p.proofUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-1"
                          >
                            <ExternalLink size={11} /> Voir le justificatif
                          </a>
                        ) : (
                          <p className="text-xs text-[#8b949e] mt-1 italic">Aucun document fourni</p>
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

      {tab === 'quartiers' && (
        loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : (() => {
          const pending  = quartiers.filter((q) => q.status === 'EN_ATTENTE');
          const resolved = quartiers.filter((q) => q.status !== 'EN_ATTENTE');

          const QuartierCard = ({ q, showActions }) => {
            const creator = q.creator ?? q.createur;
            const cName = `${creator?.firstName ?? ''} ${creator?.lastName ?? ''}`.trim();
            const nom = q.name ?? q.nom;
            const isRejected = q.status === 'REJETE';
            return (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="size-10 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-center shrink-0">
                      <span className="text-emerald-400 font-bold text-sm">{nom?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#e6edf3]">{nom}</p>
                      <div className="flex items-center gap-1 text-xs text-[#8b949e] mt-0.5">
                        <MapPin size={11} /> {q.address ?? q.adresse}
                      </div>
                      {q.description && (
                        <p className="text-xs text-[#8b949e] mt-1 max-w-sm line-clamp-2">{q.description}</p>
                      )}
                      {cName && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar name={cName} size="xs" />
                          <span className="text-xs text-[#8b949e]">
                            Par {cName} — {creator?.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!showActions && (
                      isRejected
                        ? <Badge variant="danger">Rejeté</Badge>
                        : <Badge variant="success">Actif</Badge>
                    )}
                    {showActions && <ActionButtons id={q.id} onAction={handleQuartier} />}
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
                  En attente de validation ({pending.length})
                </h2>
                {pending.length === 0
                  ? <p className="text-sm text-[#8b949e] px-1">Aucun quartier en attente.</p>
                  : <div className="space-y-3">{pending.map((q) => <QuartierCard key={q.id} q={q} showActions />)}</div>
                }
              </div>

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
                  Tous les quartiers ({resolved.length})
                </h2>
                {resolved.length === 0
                  ? <p className="text-sm text-[#8b949e] px-1">Aucun quartier traité.</p>
                  : <div className="space-y-3">{resolved.map((q) => <QuartierCard key={q.id} q={q} showActions={false} />)}</div>
                }
              </div>
            </div>
          );
        })()
      )}

      {tab === 'quartierUpdates' && (
        loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl h-28 animate-pulse" />)}
          </div>
        ) : quartierUpdates.length === 0 ? <EmptyState /> : (
          <div className="space-y-3">
            {quartierUpdates.map((q) => {
              const adminName = `${q.admin?.firstName ?? ''} ${q.admin?.lastName ?? ''}`.trim();
              return (
                <div key={q.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-[#e6edf3] mb-1">Quartier #{q.id}</p>
                      {adminName && (
                        <p className="text-xs text-[#8b949e]">Admin : {adminName} — {q.admin?.email}</p>
                      )}
                    </div>
                    <ActionButtons id={q.id} onAction={handleQuartierUpdate} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#0f1117] border border-[#30363d] rounded-md p-3 space-y-1">
                      <p className="text-[#8b949e] font-semibold uppercase tracking-wide text-[10px]">Actuel</p>
                      <p className="text-[#e6edf3] font-medium">{q.currentName}</p>
                      {q.currentDescription && (
                        <p className="text-[#8b949e] line-clamp-2">{q.currentDescription}</p>
                      )}
                      {q.currentAddress && (
                        <p className="text-[#8b949e] flex items-center gap-1">
                          <MapPin size={10} />{q.currentAddress}
                        </p>
                      )}
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-md p-3 space-y-1">
                      <p className="text-emerald-400 font-semibold uppercase tracking-wide text-[10px]">Proposé</p>
                      <p className="text-[#e6edf3] font-medium">{q.pendingName}</p>
                      {q.pendingDescription && (
                        <p className="text-[#e6edf3]/80 line-clamp-2">{q.pendingDescription}</p>
                      )}
                      {q.pendingAddress && (
                        <p className="text-emerald-300 flex items-center gap-1">
                          <MapPin size={10} />{q.pendingAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'users' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-[#21262d] rounded-md" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#8b949e]">Aucun utilisateur.</div>
          ) : (
            <div className="divide-y divide-[#30363d]/80">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e6edf3]">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-[#8b949e] truncate">{u.email}</p>
                    {u.quartiers?.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        <MapPin size={10} className="text-[#8b949e] shrink-0" />
                        {u.quartiers.map((q) => (
                          <span
                            key={q.id}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-medium"
                          >
                            {q.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#8b949e] mt-0.5">Aucun quartier</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.role === 'ADMIN_GENERAL'  && <Badge variant="purple">Super Admin</Badge>}
                    {u.role === 'ADMIN_QUARTIER' && <Badge variant="info">Admin quartier</Badge>}
                    {(u.status ?? u.statutVerification) === 'VERIFIE'
                      ? <Badge variant="success">Vérifié</Badge>
                      : (u.status ?? u.statutVerification) === 'EN_ATTENTE'
                        ? <Badge variant="warning">En attente</Badge>
                        : <Badge variant="default">Non vérifié</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
