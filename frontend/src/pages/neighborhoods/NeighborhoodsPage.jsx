import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Search, Plus, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

function NeighborhoodCard({ q, isMember, isPending, onJoin, joiningId }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col gap-4 ql-hover-border transition-colors">
      <div className="flex items-start gap-4">
        <div className="size-12 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-center shrink-0">
          <span className="text-emerald-400 font-bold text-lg">{(q.nom ?? q.name)?.[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[#e6edf3] truncate">{q.nom ?? q.name}</h3>
            {isMember && <Badge variant="success">Membre</Badge>}
            {!isMember && isPending && <Badge variant="warning"><Clock size={10} /> Demandé</Badge>}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8b949e]">
            <MapPin size={11} /><span className="truncate">{q.adresse ?? q.address}</span>
          </div>
        </div>
      </div>
      {q.description && (
        <p className="text-sm text-[#8b949e] leading-relaxed line-clamp-2">{q.description}</p>
      )}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
          <Users size={12} /> {q.membresCount ?? q.membres ?? 0} membres
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/neighborhoods/${q.id}`}>
            <Button variant="ghost" size="xs">Voir <ArrowRight size={11} /></Button>
          </Link>
          {!isMember && (
            <Button
              size="xs"
              variant={isPending ? 'secondary' : 'primary'}
              disabled={isPending}
              loading={joiningId === q.id}
              onClick={() => onJoin(q.id)}
            >
              {isPending ? 'Demandé' : 'Rejoindre'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NeighborhoodsPage() {
  const { user } = useAuth();
  const [quartiers, setQuartiers] = useState([]);
  const [memberIds, setMemberIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(new Set());
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [quartiersRes, meRes] = await Promise.all([
          api.get('/quartiers'),
          api.get('/user/me'),
        ]);
        setQuartiers(quartiersRes.data);
        setMemberIds(new Set(meRes.data.quartiers ?? []));
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const join = async (id) => {
    setJoiningId(id);
    try {
      await api.post(`/quartiers/${id}/join`);
      setPending((prev) => new Set([...prev, id]));
    } catch (err) {
      if (err?.response?.status === 409) {
        setPending((prev) => new Set([...prev, id]));
      }
    } finally {
      setJoiningId(null);
    }
  };

  const filtered = quartiers.filter((q) => {
    const s = search.toLowerCase();
    return (q.nom ?? q.name)?.toLowerCase().includes(s)
        || (q.adresse ?? q.address)?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Quartiers</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Découvrez et rejoignez les quartiers près de chez vous
          </p>
        </div>
        {user?.isVerified && (
          <Link to="/neighborhoods/create">
            <Button size="sm"><Plus size={13} /> Créer un quartier</Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7681]" />
        <input
          type="text"
          placeholder="Rechercher par nom ou adresse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0f1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="size-12 bg-[#21262d] rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#21262d] rounded w-3/4" />
                  <div className="h-2 bg-[#21262d] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-xl">
          <MapPin size={36} className="text-[#6e7681] mx-auto mb-3" />
          <p className="text-[#e6edf3] font-semibold">Aucun quartier trouvé</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#8b949e]">
            {filtered.length} quartier{filtered.length > 1 ? 's' : ''}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((q) => (
              <NeighborhoodCard
                key={q.id}
                q={q}
                isMember={memberIds.has(q.id)}
                isPending={pending.has(q.id)}
                onJoin={join}
                joiningId={joiningId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
