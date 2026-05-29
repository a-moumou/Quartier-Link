import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Search, Plus, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

function NeighborhoodCard({ q, isMember, isPending, onJoin, joiningId }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-white/8 p-5 flex flex-col gap-4 hover:border-indigo-500/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="size-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
          <span className="text-white font-bold text-lg">{q.nom?.[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white truncate">{q.nom}</h3>
            {isMember && <Badge variant="success">Membre</Badge>}
            {!isMember && isPending && <Badge variant="warning"><Clock size={10} /> Demandé</Badge>}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <MapPin size={11} /><span className="truncate">{q.adresse ?? q.address}</span>
          </div>
        </div>
      </div>
      {q.description && <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{q.description}</p>}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users size={13} /> {q.membresCount ?? q.membres ?? 0} membres
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/neighborhoods/${q.id}`}>
            <Button variant="ghost" size="xs">Voir <ArrowRight size={12} /></Button>
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
        // Fetch quartiers list + fresh membership info in parallel
        const [quartiersRes, meRes] = await Promise.all([
          api.get('/quartiers'),
          api.get('/user/me'),
        ]);
        setQuartiers(quartiersRes.data);
        // Use fresh data from /user/me so membership is always accurate
        setMemberIds(new Set(meRes.data.quartiers ?? []));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const join = async (id) => {
    setJoiningId(id);
    try {
      await api.post(`/quartiers/${id}/join`);
      setPending((prev) => new Set([...prev, id]));
    } catch (err) {
      // 409 = request already sent — show as pending anyway
      if (err?.response?.status === 409) {
        setPending((prev) => new Set([...prev, id]));
      }
    } finally {
      setJoiningId(null);
    }
  };

  const filtered = quartiers.filter((q) => {
    const s = search.toLowerCase();
    return (q.nom ?? q.name)?.toLowerCase().includes(s) || (q.adresse ?? q.address)?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quartiers</h1>
          <p className="text-sm text-slate-500 mt-1">Découvrez et rejoignez les quartiers près de chez vous</p>
        </div>
        {user?.isVerified && (
          <Link to="/neighborhoods/create">
            <Button size="sm"><Plus size={15} /> Créer un quartier</Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Rechercher par nom ou adresse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800 border border-white/8 text-white placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900 rounded-2xl border border-white/8 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="size-12 bg-slate-800 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MapPin size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucun quartier trouvé</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{filtered.length} quartier{filtered.length > 1 ? 's' : ''}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
