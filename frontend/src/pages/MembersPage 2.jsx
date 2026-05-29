import { useState, useEffect } from 'react';
import { Search, MessageSquare, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../services/api';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/user/members')
      .then((r) => setMembers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.toLowerCase();
    const quartierNames = (m.quartiers ?? []).map((qt) => qt.name?.toLowerCase() ?? '').join(' ');
    return name.includes(q) || quartierNames.includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Voisins</h1>
        <p className="text-sm text-slate-500 mt-1">Membres de votre quartier</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Rechercher un voisin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800 border border-white/8 text-white placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-white/15 transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900 rounded-2xl border border-white/8 p-5 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-800 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-white/8 p-16 text-center">
          <div className="size-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/8">
            <Users size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">Aucun voisin pour l'instant</p>
          <p className="text-sm text-slate-600 mt-1">Rejoignez un quartier pour voir vos voisins.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {filtered.length} voisin{filtered.length > 1 ? 's' : ''}
            {search && ` pour « ${search} »`}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">Aucun résultat</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => {
                const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
                return (
                  <div key={m.id} className="bg-slate-900 rounded-2xl border border-white/8 p-5 flex flex-col gap-4 hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <Avatar name={name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-sm">{name}</span>
                          {m.isAdmin && <Badge variant="info">Admin</Badge>}
                        </div>
                        {m.quartiers?.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <MapPin size={11} className="text-slate-500 shrink-0" />
                            {m.quartiers.map((q) => (
                              <span key={q.id} className="text-xs text-slate-500">{q.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => navigate('/messages', { state: { contactId: m.id } })}
                    >
                      <MessageSquare size={14} /> Message
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
