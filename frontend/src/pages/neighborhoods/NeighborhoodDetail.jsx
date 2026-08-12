import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, MapPin, Heart, MessageCircle, Send, Trash2,
} from 'lucide-react';
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
      } catch { /* ignore */ } finally { setLoading(false); }
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
    } catch { /* ignore */ } finally { setPosting(false); }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-5 bg-[#21262d] rounded w-40" />
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl h-56" />
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-3">
          <div className="h-6 bg-[#21262d] rounded w-1/3" />
          <div className="h-4 bg-[#21262d] rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      {/* Bannière */}
      <div className="relative w-full rounded-xl overflow-hidden border border-[#30363d] h-44 lg:h-56 bg-gradient-to-br from-emerald-900/40 via-[#161b22] to-[#0f1117]">
        {quartier?.bannerUrl && (
          <img src={quartier.bannerUrl} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0">
              <span className="text-emerald-300 font-bold text-xl">
                {(quartier?.nom ?? quartier?.name)?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {quartier?.nom ?? quartier?.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm text-[#e6edf3]/80">
                <MapPin size={12} /> {quartier?.adresse ?? quartier?.address}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#8b949e]">
              <Users size={14} className="text-emerald-400" />
              <span className="text-[#e6edf3] font-semibold">{quartier?.membresCount ?? members.length}</span>
              membres
            </div>
            {isMember && <Badge variant="success">Membre</Badge>}
          </div>
          {quartier?.description && (
            <p className="text-sm text-[#8b949e] leading-relaxed flex-1 min-w-0">
              {quartier.description}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#30363d]">
        <div className="flex gap-1">
          {[
            { key: 'feed', label: 'Fil d\'actualité' },
            { key: 'members', label: `Membres (${members.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
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

      {tab === 'feed' && (
        <div className="space-y-3">
          {isMember && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size="md" />
                <div className="flex-1 space-y-3">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Partagez quelque chose avec ${quartier?.nom ?? quartier?.name}...`}
                    rows={3}
                    className="w-full resize-none text-sm text-[#e6edf3] bg-[#0f1117] rounded-md border border-[#30363d] px-3 py-2.5 placeholder:text-[#6e7681] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" loading={posting} disabled={!content.trim()} onClick={submitPost}>
                      <Send size={13} /> Publier
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
              <MessageCircle size={28} className="text-[#6e7681] mx-auto mb-3" />
              <p className="text-sm text-[#e6edf3] font-medium">Aucune publication</p>
              <p className="text-xs text-[#8b949e] mt-1">Soyez le premier à publier !</p>
            </div>
          ) : posts.map((post) => {
            const name = `${post.author?.firstName ?? ''} ${post.author?.lastName ?? ''}`.trim();
            return (
              <article key={post.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#e6edf3]">{name}</span>
                        {post.author?.isVerified && <Badge variant="success">Vérifié</Badge>}
                      </div>
                      <p className="text-xs text-[#8b949e] mt-0.5">{timeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  {post.author?.id === user?.id && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-1.5 rounded-md text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="mt-3.5 text-sm text-[#e6edf3] leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
                <div className="mt-4 pt-3.5 border-t border-[#30363d]/80 flex items-center gap-5">
                  <button className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-red-400 transition-colors">
                    <Heart size={13} /> J'aime
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-emerald-400 transition-colors">
                    <MessageCircle size={13} /> Commenter
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === 'members' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl divide-y divide-[#30363d]/80">
          {members.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#8b949e]">Aucun membre.</div>
          ) : members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#e6edf3]">{m.firstName} {m.lastName}</p>
                <p className="text-xs text-[#8b949e] truncate">{m.email}</p>
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
