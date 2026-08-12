import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Heart, MessageCircle, Trash2, AlertTriangle, ImagePlus, Loader2,
  MapPin, Users, Search, Clock, LogOut, ShieldCheck, Plus,
} from 'lucide-react';
import ComposeSheet from '../../components/layout/ComposeSheet';
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

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function nominatim(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { 'Accept-Language': 'fr' } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

/* ─── Quartier browser (user has no quartier yet) ─────────────────────────── */

function QuartierBrowser({ userAddress }) {
  const { user } = useAuth();
  const isVerified = user?.isVerified || user?.role === 'super_admin';

  const [quartiers, setQuartiers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [pending, setPending] = useState(new Set());
  const [joiningId, setJoiningId] = useState(null);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!userAddress) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    const load = async () => {
      try {
        const [quartiersRes, requestsRes] = await Promise.all([
          api.get('/quartiers'),
          api.get('/user/join-requests'),
        ]);
        if (cancelled) return;

        let list = quartiersRes.data;
        const pendingIds = new Set(requestsRes.data.map((r) => r.quartierId));
        setPending(pendingIds);

        const missing = list.filter((q) => q.latitude == null && (q.address ?? q.adresse));
        if (missing.length > 0) {
          setGeocoding(true);
          for (const q of missing) {
            if (cancelled) break;
            const coords = await nominatim(q.address ?? q.adresse);
            if (coords) {
              list = list.map((x) => x.id === q.id ? { ...x, latitude: coords.lat, longitude: coords.lng } : x);
              if (!cancelled) setQuartiers([...list]);
            }
            await new Promise((r) => setTimeout(r, 1100));
          }
          if (!cancelled) setGeocoding(false);
        }

        if (!cancelled) setQuartiers(list);
      } catch { /* ignore */ } finally { if (!cancelled) setLoading(false); }
    };
    load();

    nominatim(userAddress).then((coords) => {
      if (!cancelled && coords) setUserPos(coords);
    });

    return () => { cancelled = true; };
  }, [userAddress]);

  const join = async (id) => {
    if (!userAddress || pending.has(id)) return;
    setJoiningId(id);
    try {
      await api.post(`/quartiers/${id}/join`);
      setPending((prev) => new Set([...prev, id]));
    } catch (err) {
      if (err?.response?.status === 409) setPending((prev) => new Set([...prev, id]));
    } finally {
      setJoiningId(null);
    }
  };

  const withDistance = quartiers.map((q) => ({
    ...q,
    distance: (userPos && q.latitude != null && q.longitude != null)
      ? haversine(userPos.lat, userPos.lng, q.latitude, q.longitude)
      : null,
  }));

  const nearbyActive = userPos !== null && withDistance.some((q) => q.distance !== null);
  const visible = nearbyActive
    ? withDistance.filter((q) => q.distance === null || q.distance <= 0.5)
    : withDistance;

  const sorted = [...visible].sort((a, b) => {
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    if (a.distance !== null) return -1;
    if (b.distance !== null) return 1;
    return 0;
  });

  const filtered = sorted.filter((q) => {
    const s = search.toLowerCase();
    return (q.nom ?? q.name)?.toLowerCase().includes(s) || (q.adresse ?? q.address)?.toLowerCase().includes(s);
  });

  if (!isVerified) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Compte non vérifié</p>
            <p className="text-xs text-[#8b949e] mt-1">
              <Link to="/profile" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Envoyer un justificatif →
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Découvrir des quartiers</h1>
        <p className="text-sm text-[#8b949e] mt-1">
          Rejoignez la communauté de votre voisinage.
        </p>
      </div>

      {!userAddress && (
        <>
          <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Adresse requise</p>
              <p className="text-xs text-[#8b949e] mt-1">
                <Link to="/profile" className="text-emerald-400 hover:text-emerald-300 font-medium">
                  Mettre à jour mon profil →
                </Link>
              </p>
            </div>
          </div>
          <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-xl">
            <MapPin size={36} className="text-[#6e7681] mx-auto mb-3" />
            <p className="text-[#e6edf3] font-semibold">Aucun quartier à afficher</p>
            <p className="text-[#8b949e] text-sm mt-1">
              Renseignez votre adresse pour voir les quartiers proches.
            </p>
          </div>
        </>
      )}

      {userAddress && geocoding && (
        <div className="flex items-center gap-2 text-xs text-[#8b949e]">
          <Loader2 size={13} className="animate-spin" />
          <span>Géolocalisation en cours…</span>
        </div>
      )}
      {userAddress && !geocoding && nearbyActive && (
        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
          <MapPin size={11} />
          Quartiers à moins de 500 m
        </div>
      )}

      {userAddress && (
        <>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7681]" />
            <input
              type="text"
              placeholder="Rechercher un quartier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0f1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 animate-pulse">
                  <div className="flex gap-3">
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
              {nearbyActive && (
                <p className="text-[#8b949e] text-sm mt-1">Essayez une recherche par nom</p>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((q) => {
                const isPending = pending.has(q.id);
                return (
                  <div
                    key={q.id}
                    className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col gap-4 ql-hover-border transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-12 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-center shrink-0">
                        <span className="text-emerald-400 font-bold text-lg">
                          {(q.nom ?? q.name)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-[#e6edf3] truncate">{q.nom ?? q.name}</h3>
                          {isPending && <Badge variant="warning"><Clock size={10} /> Demandé</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8b949e]">
                          <MapPin size={11} /><span className="truncate">{q.adresse ?? q.address}</span>
                        </div>
                        {q.distance !== null && (
                          <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                            {q.distance < 1 ? `${Math.round(q.distance * 1000)} m` : `${q.distance.toFixed(1)} km`}
                          </p>
                        )}
                      </div>
                    </div>
                    {q.description && (
                      <p className="text-sm text-[#8b949e] leading-relaxed line-clamp-2">{q.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                        <Users size={12} /> {q.membres ?? 0} membres
                      </div>
                      <Button
                        size="xs"
                        variant={isPending ? 'secondary' : 'primary'}
                        disabled={isPending}
                        loading={joiningId === q.id}
                        onClick={() => join(q.id)}
                      >
                        {isPending ? 'Demandé' : 'Rejoindre'}
                      </Button>
                    </div>
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

/* ─── Post card ───────────────────────────────────────────────────────────── */

function PostCard({ post, currentUser, onDelete }) {
  const name = `${post.author?.firstName ?? ''} ${post.author?.lastName ?? ''}`.trim();
  const [liked, setLiked]               = useState(post.likedByMe ?? false);
  const [likesCount, setLikesCount]     = useState(post.likesCount ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments]         = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsCount, setCommentsCount]   = useState(post.commentsCount ?? 0);
  const [newComment, setNewComment]     = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const toggleLike = async () => {
    const prevLiked = liked; const prevCount = likesCount;
    setLiked(!liked); setLikesCount((c) => liked ? c - 1 : c + 1);
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setLiked(res.data.liked); setLikesCount(res.data.count);
    } catch { setLiked(prevLiked); setLikesCount(prevCount); }
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data); setCommentsLoaded(true);
    } catch { /* ignore */ }
  };

  const toggleComments = () => {
    const next = !commentsOpen; setCommentsOpen(next);
    if (next && !commentsLoaded) loadComments();
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: newComment.trim() });
      setComments((prev) => [...prev, res.data]);
      setCommentsCount((c) => c + 1);
      setNewComment('');
    } catch { /* ignore */ } finally { setSendingComment(false); }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${post.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((c) => c - 1);
    } catch { /* ignore */ }
  };

  return (
    <article className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
      <div className="p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#e6edf3]">{name}</span>
                {post.author?.isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    <ShieldCheck size={10} /> Admin
                  </span>
                )}
                {post.author?.isVerified && <Badge variant="success">Vérifié</Badge>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#8b949e]">
                <span>{post.quartierNom ?? 'Quartier'}</span>
                <span>·</span>
                <span>{timeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          {post.author?.id === currentUser?.id && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded-md text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
              aria-label="Supprimer la publication"
            >
              <Trash2 size={14} />
            </button>
          )}
        </header>

        <p className="mt-3.5 text-sm text-[#e6edf3] leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        <footer className="mt-4 pt-3.5 border-t border-[#30363d]/80 flex items-center gap-5">
          <button
            onClick={toggleLike}
            className={[
              'flex items-center gap-1.5 text-xs font-medium transition-colors',
              liked ? 'text-red-400' : 'text-[#8b949e] hover:text-red-400',
            ].join(' ')}
          >
            <Heart size={14} className={liked ? 'fill-red-400' : ''} />
            {likesCount > 0 ? likesCount : 'J\'aime'}
          </button>
          <button
            onClick={toggleComments}
            className={[
              'flex items-center gap-1.5 text-xs font-medium transition-colors',
              commentsOpen ? 'text-emerald-400' : 'text-[#8b949e] hover:text-emerald-400',
            ].join(' ')}
          >
            <MessageCircle size={14} />
            {commentsCount > 0 ? commentsCount : 'Commenter'}
          </button>
        </footer>
      </div>

      {commentsOpen && (
        <div className="border-t border-[#30363d]/80 px-5 py-4 space-y-3 bg-[#0f1117]/40">
          {!commentsLoaded && (
            <div className="flex justify-center py-2">
              <Loader2 size={16} className="animate-spin text-[#8b949e]" />
            </div>
          )}
          {commentsLoaded && comments.length === 0 && (
            <p className="text-xs text-[#8b949e] text-center py-1">
              Aucun commentaire. Soyez le premier !
            </p>
          )}
          {commentsLoaded && comments.map((c) => {
            const cName = `${c.author?.firstName ?? ''} ${c.author?.lastName ?? ''}`.trim();
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar name={cName} size="xs" />
                <div className="flex-1 min-w-0 bg-[#161b22] border border-[#30363d]/80 rounded-md px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#e6edf3]">{cName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#8b949e]">{timeAgo(c.createdAt)}</span>
                      {c.author?.id === currentUser?.id && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-[#8b949e] hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#e6edf3] mt-0.5 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            );
          })}
          <form onSubmit={addComment} className="flex items-center gap-2 pt-1">
            <Avatar name={`${currentUser?.firstName} ${currentUser?.lastName}`} size="xs" />
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrire un commentaire..."
              className="flex-1 text-xs bg-[#0f1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || sendingComment}
              className="size-8 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors shrink-0"
              aria-label="Envoyer le commentaire"
            >
              {sendingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

/* ─── Banner ──────────────────────────────────────────────────────────────── */

function QuartierBanner({ quartier, isAdmin, onBannerChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('banner', file);
      const res = await api.post('/admin/banner', form, { headers: { 'Content-Type': undefined } });
      onBannerChange(res.data.bannerUrl);
    } catch { /* ignore */ } finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#30363d] h-44 lg:h-56 bg-gradient-to-br from-emerald-900/40 via-[#161b22] to-[#0f1117]">
      {quartier.bannerUrl && (
        <img src={quartier.bannerUrl} alt="" className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/40 to-transparent" />
      <div className="absolute bottom-0 left-0 p-5">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider mb-2">
          <span className="size-1.5 bg-emerald-400 rounded-full ql-pulse-dot" />
          Quartier actif
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{quartier.nom ?? quartier.name}</h2>
        {(quartier.adresse ?? quartier.address) && (
          <p className="text-sm text-[#e6edf3]/80 mt-0.5 flex items-center gap-1.5">
            <MapPin size={12} /> {quartier.adresse ?? quartier.address}
          </p>
        )}
      </div>
      {isAdmin && (
        <div className="absolute top-4 right-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-md border border-white/20 transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
            {uploading ? 'Envoi...' : 'Bannière'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { user } = useAuth();
  const [posts, setPosts]           = useState([]);
  const [quartiers, setQuartiers]   = useState([]);
  const [content, setContent]       = useState('');
  const [quartierId, setQuartierId] = useState('');
  const [loading, setLoading]       = useState(true);
  const [posting, setPosting]       = useState(false);
  const [hasQuartier, setHasQuartier] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/user/me');
        const ids = meRes.data.quartiers ?? [];
        const addr = meRes.data.adresse ?? meRes.data.address ?? null;
        setUserAddress(addr);

        if (ids.length === 0) {
          setHasQuartier(false);
          return;
        }

        setHasQuartier(true);
        const [postsRes, ...qsRes] = await Promise.all([
          api.get('/posts'),
          ...ids.map((id) => api.get(`/quartiers/${id}`)),
        ]);
        setPosts(postsRes.data);
        const list = qsRes.map((r) => r.data);
        setQuartiers(list);
        if (list.length) setQuartierId(String(list[0].id));
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const submitPost = async () => {
    if (!content.trim() || !quartierId) return;
    setPosting(true);
    try {
      const res = await api.post('/posts', { content: content.trim(), quartierId: Number(quartierId) });
      setPosts([res.data, ...posts]);
      setContent('');
      setComposeOpen(false);
    } catch { /* ignore */ } finally { setPosting(false); }
  };

  const deletePost = async (id) => {
    try {
      await api.delete(`/posts/${id}`);
      setPosts((p) => p.filter((x) => x.id !== id));
    } catch { /* ignore */ }
  };

  const isVerified = user?.isVerified || user?.role === 'super_admin';

  const adminQuartier = quartiers.find((q) => q.adminId === user?.id);
  const bannerQuartier = adminQuartier ?? quartiers[0] ?? null;

  const leaveQuartier = async (id) => {
    setLeavingId(id);
    try {
      await api.delete(`/quartiers/${id}/leave`);
      const remaining = quartiers.filter((q) => q.id !== id);
      setQuartiers(remaining);
      if (remaining.length === 0) setHasQuartier(false);
      else if (quartierId === String(id)) setQuartierId(String(remaining[0].id));
    } catch { /* ignore */ } finally {
      setLeavingId(null);
      setConfirmLeaveId(null);
    }
  };

  const handleBannerChange = (bannerUrl) => {
    setQuartiers((prev) =>
      prev.map((q) => q.id === bannerQuartier.id ? { ...q, bannerUrl } : q)
    );
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="w-full rounded-xl bg-[#161b22] border border-[#30363d] animate-pulse h-44" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="size-10 bg-[#21262d] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#21262d] rounded w-32" />
                  <div className="h-2 bg-[#21262d] rounded w-20" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-[#21262d] rounded" />
                <div className="h-3 bg-[#21262d] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasQuartier) return <QuartierBrowser userAddress={userAddress} />;

  return (
    <div className="space-y-5">
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Fil d'actualité</h1>
          <p className="text-sm text-[#8b949e] mt-0.5">
            {bannerQuartier?.nom ?? bannerQuartier?.name ?? 'Votre quartier'}
          </p>
        </div>
        {isVerified && (
          <Button onClick={() => setComposeOpen(true)} size="md">
            <Plus size={14} /> Publier
          </Button>
        )}
      </div>

      {bannerQuartier && (
        <QuartierBanner
          quartier={bannerQuartier}
          isAdmin={!!adminQuartier}
          onBannerChange={handleBannerChange}
        />
      )}

      {quartiers.length > 1 && (
        <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {quartiers.map((q) => {
            const isAdmin = q.adminId === user?.id;
            const active = quartierId === String(q.id);
            return (
              <button
                key={q.id}
                onClick={() => setQuartierId(String(q.id))}
                className={[
                  'flex items-center gap-2 shrink-0 px-3 py-2 rounded-md border text-xs font-medium transition-colors',
                  active
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]',
                ].join(' ')}
              >
                <span className="size-5 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                  {(q.nom ?? q.name)?.[0]?.toUpperCase()}
                </span>
                <span className="truncate max-w-[6rem]">{q.nom ?? q.name}</span>
                {isAdmin && <ShieldCheck size={11} className="text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">
        <div className="space-y-4">
          {!isVerified && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Vérification en attente</p>
                <p className="text-xs text-[#8b949e] mt-1">
                  <Link to="/upload-proof" className="text-emerald-400 hover:text-emerald-300 font-medium">
                    Envoyer un justificatif →
                  </Link>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
                <MessageCircle size={28} className="text-[#6e7681] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#e6edf3]">Aucune publication</p>
                <p className="text-xs text-[#8b949e] mt-1">
                  {isVerified
                    ? 'Soyez le premier à partager quelque chose !'
                    : 'Vérifiez votre compte pour publier.'}
                </p>
              </div>
            ) : (
              posts.map((p) => (
                <PostCard key={p.id} post={p} currentUser={user} onDelete={deletePost} />
              ))
            )}
          </div>
        </div>

        {quartiers.length > 0 && (
          <aside className="hidden lg:block space-y-3 sticky top-20">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
                Mes quartiers
              </h2>
              <div className="space-y-1.5">
                {quartiers.map((q) => {
                  const isAdmin = q.adminId === user?.id;
                  const isActive = quartierId === String(q.id);
                  const isConfirming = confirmLeaveId === q.id;
                  return (
                    <div key={q.id} className="rounded-md overflow-hidden">
                      <button
                        onClick={() => setQuartierId(String(q.id))}
                        className={[
                          'w-full flex items-center gap-2.5 p-2 text-left transition-colors rounded-md',
                          isActive
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'hover:bg-[#21262d] border border-transparent',
                        ].join(' ')}
                      >
                        <div className={[
                          'size-9 rounded-md flex items-center justify-center font-bold text-sm shrink-0',
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#21262d] text-[#e6edf3] border border-[#30363d]',
                        ].join(' ')}>
                          {(q.nom ?? q.name)?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#e6edf3] truncate">{q.nom ?? q.name}</p>
                          <p className="text-xs text-[#8b949e] truncate">{q.adresse ?? q.address}</p>
                          {isAdmin && (
                            <span className="text-[10px] text-emerald-400 font-medium">Administrateur</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center justify-between px-2 mt-0.5">
                        <Link
                          to={`/neighborhoods/${q.id}`}
                          className="text-[10px] text-[#8b949e] hover:text-emerald-400 font-medium transition-colors"
                        >
                          Détails →
                        </Link>
                        {!isAdmin && (
                          isConfirming ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setConfirmLeaveId(null)}
                                className="text-[10px] text-[#8b949e] hover:text-[#e6edf3]"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => leaveQuartier(q.id)}
                                disabled={leavingId === q.id}
                                className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
                              >
                                {leavingId === q.id ? <Loader2 size={10} className="animate-spin" /> : <LogOut size={10} />}
                                Quitter
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmLeaveId(q.id)}
                              className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-red-400 transition-colors"
                            >
                              <LogOut size={10} /> Quitter
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* FAB mobile */}
      {isVerified && (
        <button
          onClick={() => setComposeOpen(true)}
          className="lg:hidden fixed bottom-20 right-5 z-40 size-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg shadow-emerald-900/50 flex items-center justify-center transition-colors"
          aria-label="Publier"
        >
          <Plus size={22} strokeWidth={2.25} />
        </button>
      )}

      <ComposeSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        user={user}
        content={content}
        onChange={setContent}
        onSubmit={submitPost}
        posting={posting}
        quartiers={quartiers}
        quartierId={quartierId}
        onQuartierChange={setQuartierId}
      />
    </div>
  );
}
