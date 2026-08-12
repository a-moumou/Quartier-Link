import { useState, useEffect } from 'react';
import { Search, MessageSquare, MapPin, Users, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
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

  const filtered = members
    .filter((m) => {
      const q = search.toLowerCase();
      const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.toLowerCase();
      const quartierNames = (m.quartiers ?? [])
        .map((qt) => qt.name?.toLowerCase() ?? '').join(' ');
      return name.includes(q) || quartierNames.includes(q);
    })
    .sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Voisins</h1>
        <p className="text-sm text-[#8b949e] mt-1">Membres de votre quartier</p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7681]" />
        <input
          type="text"
          placeholder="Rechercher un voisin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0f1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-[#21262d] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#21262d] rounded w-2/3" />
                  <div className="h-2 bg-[#21262d] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
          <div className="size-12 bg-[#21262d] border border-[#30363d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Users size={22} className="text-[#8b949e]" />
          </div>
          <p className="text-[#e6edf3] font-semibold">Aucun voisin pour l'instant</p>
          <p className="text-sm text-[#8b949e] mt-1">Rejoignez un quartier pour voir vos voisins.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#8b949e]">
            {filtered.length} voisin{filtered.length > 1 ? 's' : ''}
            {search && ` pour « ${search} »`}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-[#161b22] border border-[#30363d] rounded-xl">
              <p className="text-[#8b949e] font-medium">Aucun résultat</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((m) => {
                const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
                return (
                  <div
                    key={m.id}
                    className={[
                      'rounded-xl p-5 flex flex-col gap-4 transition-colors border',
                      m.isAdmin
                        ? 'bg-[#161b22] border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-[#161b22] border-[#30363d] hover:border-emerald-500/40',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <Avatar name={name} size="md" />
                        {m.isAdmin && (
                          <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#161b22]">
                            <ShieldCheck size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-[#e6edf3] text-sm">{name}</span>
                        {m.isAdmin && (
                          <p className="text-xs text-emerald-400 font-medium mt-0.5">
                            Administrateur du quartier
                          </p>
                        )}
                        {m.quartiers?.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <MapPin size={11} className="text-[#8b949e] shrink-0" />
                            {m.quartiers.map((q) => (
                              <span key={q.id} className="text-xs text-[#8b949e]">{q.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={m.isAdmin ? 'primary' : 'secondary'}
                      size="sm"
                      fullWidth
                      onClick={() => navigate('/messages', { state: { contactId: m.id } })}
                    >
                      <MessageSquare size={13} /> Envoyer un message
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
