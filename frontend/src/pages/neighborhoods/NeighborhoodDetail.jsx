import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'À l\'instant';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} j`;
}

export default function NeighborhoodDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [quartier, setQuartier] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('feed');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isMember = (user?.quartiers ?? []).includes(Number(id));

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, postsRes, membersRes] = await Promise.all([
          api.get(`/quartiers/${id}`),
          api.get(`/posts/quartier/${id}`),
          api.get('/admin/members'),
        ]);
        setQuartier(qRes.data);
        setPosts(postsRes.data);
        setMembers(membersRes.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const submitPost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await api.post('/posts', { content: content.trim(), quartierId: Number(id) });
      setPosts([res.data, ...posts]);
      setContent('');
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch { /* ignore */ }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 bg-slate-800 rounded w-40" />
      <div className="bg-slate-900 rounded-2xl border border-white/8 p-6 space-y-3">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-slate-800/60 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link to="/neighborhoods" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-400 transition-colors">
        <ArrowLeft size={16} /> Retour aux quartiers
      </Link>

      {/* Header */}
      <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
        <div className="flex items-start gap-5">
          <div className="size-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <span className="text-white font-bold text-2xl">{quartier?.nom?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white tracking-tight">{quartier?.nom}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500"><MapPin size={14} /> {quartier?.adresse}</div>
            {quartier?.description && <p className="mt-3 text-sm text-slate-400 leading-relaxed">{quartier.description}</p>}
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-4">
              <Users size={15} /> {quartier?.membresCount ?? members.length} membres
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex">
          {[{ key: 'feed', label: 'Fil d\'actualité' }, { key: 'members', label: `Membres (${members.length})` }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={['px-5 py-3 text-sm font-medium border-b-2 transition-colors', tab === t.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-white hover:border-white/10'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'feed' && (
        <div className="space-y-4">
          {isMember && (
            <div className="bg-slate-900 rounded-2xl border border-white/8 p-5">
              <div className="flex items-start gap-3">
                <Avatar name={`${user?.firstName} ${user?.lastName}`} size="md" />
                <div className="flex-1 space-y-3">
                  <textarea value={content} onChange={(e) => setContent(e.target.value)}
                    placeholder={`Partagez quelque chose avec ${quartier?.nom}...`} rows={3}
                    className="w-full resize-none text-sm text-white bg-slate-800 rounded-xl border border-white/8 px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" loading={posting} disabled={!content.trim()} onClick={submitPost}>
                      <Send size={14} /> Publier
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl border border-white/8 p-12 text-center">
              <p className="text-slate-600 text-sm">Aucune publication dans ce quartier.</p>
            </div>
          ) : posts.map((post) => {
            const name = `${post.author?.firstName ?? ''} ${post.author?.lastName ?? ''}`.trim();
            return (
              <div key={post.id} className="bg-slate-900 rounded-2xl border border-white/8 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{name}</span>
                        {post.author?.isVerified && <Badge variant="success">Vérifié</Badge>}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{timeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  {post.author?.id === user?.id && (
                    <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="mt-3.5 text-sm text-slate-300 leading-relaxed">{post.content}</p>
                <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-400 transition-colors"><Heart size={14} /> J'aime</button>
                  <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-400 transition-colors"><MessageCircle size={14} /> Commenter</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'members' && (
        <div className="bg-slate-900 rounded-2xl border border-white/8 divide-y divide-white/5">
          {members.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-600">Aucun membre.</div>
          ) : members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{m.firstName} {m.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{m.email}</p>
              </div>
              {m.isCreateur && <Badge variant="primary">Créateur</Badge>}
              {m.isAdmin && !m.isCreateur && <Badge variant="info">Admin</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
