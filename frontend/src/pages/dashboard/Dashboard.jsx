import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Heart, MessageCircle, Trash2, AlertTriangle, ChevronDown, ImagePlus, Loader2, MapPin, Users, Search, Clock, LogOut, ShieldCheck } from 'lucide-react';
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

/* ─── Haversine distance (km) ─────────────────────────────────────────────── */

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

        // Geocode quartiers that have an address but no coordinates
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
            // Respect Nominatim's 1 req/s rate limit
            await new Promise((r) => setTimeout(r, 1100));
          }
          if (!cancelled) setGeocoding(false);
        }

        if (!cancelled) setQuartiers(list);
      } catch { /* ignore */ } finally { if (!cancelled) setLoading(false); }
    };
    load();

    // Geocode the user's profile address to use as reference point
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

  // Attach distance to each quartier based on the user's profile address
  const withDistance = quartiers.map((q) => ({
    ...q,
    distance: (userPos && q.latitude != null && q.longitude != null)
      ? haversine(userPos.lat, userPos.lng, q.latitude, q.longitude)
      : null,
  }));

  // Filter to ≤ 500 m when user position is known, otherwise show all
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Choisissez votre quartier</h1>
          <p className="text-sm text-slate-500 mt-1">Rejoignez la communauté de votre quartier pour accéder au fil d'actualité</p>
        </div>
        <div className="flex items-start gap-3 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Compte non vérifié</p>
            <p className="text-xs text-amber-500 mt-1">
              Votre compte doit être vérifié par un administrateur avant de pouvoir rejoindre un quartier.{' '}
              <Link to="/profile" className="font-semibold underline">Envoyer un justificatif →</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Choisissez votre quartier</h1>
        <p className="text-sm text-slate-500 mt-1">Rejoignez la communauté de votre quartier pour accéder au fil d'actualité</p>
      </div>

      {!userAddress && (
        <>
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Adresse requise pour voir les quartiers</p>
              <p className="text-xs text-amber-500 mt-0.5">
                Ajoutez votre adresse dans votre profil pour découvrir les quartiers de votre zone.{' '}
                <Link to="/profile" className="font-semibold underline">Mettre à jour mon profil →</Link>
              </p>
            </div>
          </div>
          <div className="text-center py-16">
            <MapPin size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucun quartier à afficher</p>
            <p className="text-slate-600 text-xs mt-1">Renseignez votre adresse pour voir les quartiers proches de chez vous.</p>
          </div>
        </>
      )}

      {userAddress && geocoding && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 size={13} className="animate-spin" />
          <span>Géolocalisation des quartiers en cours…</span>
        </div>
      )}
      {userAddress && !geocoding && nearbyActive && (
        <div className="flex items-center gap-2 text-xs text-indigo-400">
          <MapPin size={13} />
          <span>Quartiers proches de votre adresse (&le; 500 m)</span>
        </div>
      )}

      {userAddress && (
        <>
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
                    <div className="flex-1 space-y-2"><div className="h-4 bg-slate-800 rounded w-3/4" /><div className="h-3 bg-slate-800/60 rounded w-1/2" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <MapPin size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Aucun quartier trouvé près de vous</p>
              {nearbyActive && (
                <p className="text-slate-600 text-xs mt-1">Essayez de rechercher par nom pour voir tous les quartiers</p>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((q) => {
                const isPending = pending.has(q.id);
                return (
                  <div key={q.id} className="bg-slate-900 rounded-2xl border border-white/8 p-5 flex flex-col gap-4 hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="size-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                        <span className="text-white font-bold text-lg">{(q.nom ?? q.name)?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-white truncate">{q.nom ?? q.name}</h3>
                          {isPending && <Badge variant="warning"><Clock size={10} /> Demandé</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                          <MapPin size={11} /><span className="truncate">{q.adresse ?? q.address}</span>
                        </div>
                        {q.distance !== null && (
                          <p className="text-[10px] text-indigo-400/70 mt-0.5">{q.distance < 1 ? `${Math.round(q.distance * 1000)} m` : `${q.distance.toFixed(1)} km`}</p>
                        )}
                      </div>
                    </div>
                    {q.description && <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{q.description}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Users size={13} /> {q.membres ?? 0} membres
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

/* ─── Post card (feed) ────────────────────────────────────────────────────── */

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
      setComments((prev) => [...prev, res.data]); setCommentsCount((c) => c + 1); setNewComment('');
    } catch { /* ignore */ } finally { setSendingComment(false); }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${post.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId)); setCommentsCount((c) => c - 1);
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-white/8">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white">{name}</span>
                {post.author?.isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
                    <ShieldCheck size={10} /> Admin
                  </span>
                )}
                {post.author?.isVerified && <Badge variant="success">Vérifié</Badge>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-600">
                <span>{post.quartierNom ?? 'Quartier'}</span>
                <span>·</span>
                <span>{timeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          {post.author?.id === currentUser?.id && (
            <button onClick={() => onDelete(post.id)} className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="mt-3.5 text-sm text-slate-300 leading-relaxed">{post.content}</p>
        <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center gap-4">
          <button onClick={toggleLike} className={['flex items-center gap-1.5 text-xs font-medium transition-colors', liked ? 'text-rose-400' : 'text-slate-600 hover:text-rose-400'].join(' ')}>
            <Heart size={14} className={liked ? 'fill-rose-400' : ''} />
            {likesCount > 0 ? likesCount : 'J\'aime'}
          </button>
          <button onClick={toggleComments} className={['flex items-center gap-1.5 text-xs font-medium transition-colors', commentsOpen ? 'text-indigo-400' : 'text-slate-600 hover:text-indigo-400'].join(' ')}>
            <MessageCircle size={14} />
            {commentsCount > 0 ? commentsCount : 'Commenter'}
          </button>
        </div>
      </div>

      {commentsOpen && (
        <div className="border-t border-white/5 px-5 py-4 space-y-3">
          {!commentsLoaded && <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-slate-600" /></div>}
          {commentsLoaded && comments.length === 0 && <p className="text-xs text-slate-600 text-center py-1">Aucun commentaire. Soyez le premier !</p>}
          {commentsLoaded && comments.map((c) => {
            const cName = `${c.author?.firstName ?? ''} ${c.author?.lastName ?? ''}`.trim();
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar name={cName} size="xs" />
                <div className="flex-1 min-w-0 bg-slate-800 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{cName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-600">{timeAgo(c.createdAt)}</span>
                      {c.author?.id === currentUser?.id && (
                        <button onClick={() => deleteComment(c.id)} className="text-slate-700 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{c.content}</p>
                </div>
              </div>
            );
          })}
          <form onSubmit={addComment} className="flex items-center gap-2 pt-1">
            <Avatar name={`${currentUser?.firstName} ${currentUser?.lastName}`} size="xs" />
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Écrire un commentaire..."
              className="flex-1 text-xs bg-slate-800 border border-white/8 text-white placeholder:text-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <button type="submit" disabled={!newComment.trim() || sendingComment}
              className="size-8 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 disabled:opacity-40 text-white rounded-xl transition-all shrink-0">
              {sendingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>
        </div>
      )}
    </div>
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
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 280 }}>
      {quartier.bannerUrl
        ? <img src={quartier.bannerUrl} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-gradient-to-br from-indigo-600/40 via-violet-600/30 to-slate-900" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
      <div className="absolute bottom-0 left-0 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">Fil d'actualité</p>
        <h2 className="text-2xl font-bold text-white tracking-tight">{quartier.nom ?? quartier.name}</h2>
        {(quartier.adresse ?? quartier.address) && <p className="text-sm text-slate-400 mt-0.5">{quartier.adresse ?? quartier.address}</p>}
      </div>
      {isAdmin && (
        <div className="absolute top-4 right-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-xl border border-white/20 transition-colors disabled:opacity-60">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
            {uploading ? 'Envoi...' : 'Changer la bannière'}
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
  const [hasQuartier, setHasQuartier] = useState(null); // null = loading
  const [userAddress, setUserAddress] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/user/me');
        const ids = meRes.data.quartiers ?? [];
        const addr = meRes.data.adresse ?? meRes.data.address ?? null;
        setUserAddress(addr);

        if (ids.length === 0) {
          // No quartier yet → show browser
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
    } catch { /* ignore */ } finally { setPosting(false); }
  };

  const deletePost = async (id) => {
    try { await api.delete(`/posts/${id}`); setPosts((p) => p.filter((x) => x.id !== id)); } catch { /* ignore */ }
  };

  const isVerified = user?.isVerified || user?.role === 'super_admin';

  const adminQuartier = quartiers.find((q) => q.adminId === user?.id);
  const bannerQuartier = adminQuartier ?? quartiers[0] ?? null;
  const [leavingId, setLeavingId] = useState(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState(null);

  const leaveQuartier = async (id) => {
    setLeavingId(id);
    try {
      await api.delete(`/quartiers/${id}/leave`);
      const remaining = quartiers.filter((q) => q.id !== id);
      setQuartiers(remaining);
      if (remaining.length === 0) setHasQuartier(false);
      else if (quartierId === String(id)) setQuartierId(String(remaining[0].id));
    } catch { /* ignore */ } finally { setLeavingId(null); setConfirmLeaveId(null); }
  };

  const handleBannerChange = (bannerUrl) => {
    setQuartiers((prev) => prev.map((q) => q.id === bannerQuartier.id ? { ...q, bannerUrl } : q));
  };

  // Full-page skeleton while we determine which view to show
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="w-full rounded-2xl bg-slate-900 border border-white/8 animate-pulse" style={{ height: 280 }} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 rounded-2xl border border-white/8 p-5 animate-pulse">
              <div className="flex gap-3"><div className="size-10 bg-slate-800 rounded-full" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-800 rounded w-32" /><div className="h-2 bg-slate-800/60 rounded w-20" /></div></div>
              <div className="mt-4 space-y-2"><div className="h-3 bg-slate-800/60 rounded" /><div className="h-3 bg-slate-800/60 rounded w-3/4" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No quartier yet → show quartier browser
  if (!hasQuartier) return <QuartierBrowser userAddress={userAddress} />;

  // Has quartier → show feed
  return (
    <div className="space-y-6">
      {bannerQuartier && (
        <QuartierBanner
          quartier={bannerQuartier}
          isAdmin={!!adminQuartier}
          onBannerChange={handleBannerChange}
        />
      )}

      {!isVerified && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Compte en attente de vérification</p>
            <p className="text-xs text-amber-500 mt-0.5">
              Envoyez votre justificatif pour accéder aux publications.{' '}
              <Link to="/upload-proof" className="font-semibold underline">Envoyer maintenant →</Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {isVerified && (
            <div className="bg-slate-900 rounded-2xl border border-white/8 p-5">
              <div className="flex items-start gap-3">
                <Avatar name={`${user?.firstName} ${user?.lastName}`} size="md" />
                <div className="flex-1 space-y-3">
                  <textarea
                    value={content} onChange={(e) => setContent(e.target.value)}
                    placeholder="Partagez une actualité avec vos voisins..."
                    rows={3}
                    className="w-full resize-none text-sm text-white placeholder:text-slate-600 bg-slate-800 rounded-xl border border-white/8 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative">
                      <select value={quartierId} onChange={(e) => setQuartierId(e.target.value)}
                        className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-slate-800 border border-white/8 text-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors">
                        {quartiers.map((q) => <option key={q.id} value={String(q.id)}>{q.nom ?? q.name}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    </div>
                    <Button size="sm" onClick={submitPost} loading={posting} disabled={!content.trim()}>
                      <Send size={14} /> Publier
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl border border-white/8 p-12 text-center">
              <p className="text-slate-600 text-sm">Aucune publication pour le moment.</p>
              <p className="text-slate-700 text-xs mt-1">Soyez le premier à partager une actualité !</p>
            </div>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} currentUser={user} onDelete={deletePost} />)
          )}
        </div>

        <div>
          <div className="bg-slate-900 rounded-2xl border border-white/8 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Mon quartier</h2>
            <div className="space-y-2">
              {quartiers.map((q) => {
                const isAdmin = q.adminId === user?.id;
                const isConfirming = confirmLeaveId === q.id;
                return (
                  <div key={q.id} className="rounded-xl overflow-hidden">
                    <Link to={`/neighborhoods/${q.id}`} className="flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors">
                      <div className="size-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                        <span className="text-white font-bold text-sm">{(q.nom ?? q.name)?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{q.nom ?? q.name}</p>
                        <p className="text-xs text-slate-600 truncate">{q.adresse ?? q.address}</p>
                      </div>
                    </Link>

                    {/* Leave button — hidden for admin (creator can't leave) */}
                    {!isAdmin && (
                      isConfirming ? (
                        <div className="flex items-center gap-2 px-2.5 pb-2.5">
                          <p className="text-xs text-slate-400 flex-1">Quitter ce quartier ?</p>
                          <button
                            onClick={() => setConfirmLeaveId(null)}
                            className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded-lg transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => leaveQuartier(q.id)}
                            disabled={leavingId === q.id}
                            className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {leavingId === q.id ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
                            Quitter
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmLeaveId(q.id)}
                          className="w-full flex items-center gap-1.5 px-2.5 pb-2 text-xs text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <LogOut size={11} /> Quitter le quartier
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
