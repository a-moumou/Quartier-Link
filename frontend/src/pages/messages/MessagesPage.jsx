import { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import mqtt from 'mqtt';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MQTT_URL = 'ws://192.168.64.2:9001';

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'À l\'instant';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} j`;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const activeRef = useRef(null);
  const mqttRef = useRef(null);

  // Keep activeRef in sync so the MQTT callback always sees the current value
  useEffect(() => { activeRef.current = active; }, [active]);

  // MQTT connection — subscribe to chat/{myId}
  useEffect(() => {
    if (!user?.id) return;

    const client = mqtt.connect(MQTT_URL, { clientId: `ql-${user.id}-${Date.now()}` });
    mqttRef.current = client;

    client.on('connect', () => {
      setConnected(true);
      client.subscribe(`chat/${user.id}`);
    });

    client.on('close', () => setConnected(false));
    client.on('error', () => setConnected(false));

    client.on('message', (_topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());
        const currentActive = activeRef.current;

        // Add to messages if conversation with sender is open
        if (currentActive?.id === msg.senderId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, isMe: false }];
          });
        }

        // Update conversation list preview
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === msg.senderId);
          if (exists) {
            return prev.map((c) =>
              c.id === msg.senderId
                ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt } }
                : c
            );
          }
          // New conversation — add it (will be properly loaded on next refresh)
          return [
            { id: msg.senderId, firstName: '?', lastName: '', lastMessage: { content: msg.content, createdAt: msg.createdAt } },
            ...prev,
          ];
        });
      } catch { /* ignore malformed */ }
    });

    return () => { client.end(); };
  }, [user?.id]);

  useEffect(() => {
    api.get('/messages/contacts')
      .then((r) => {
        setConversations(r.data);
        // Si on arrive depuis la page Voisins avec un contactId, ouvrir directement cette conversation
        const contactId = location.state?.contactId;
        if (contactId) {
          const contact = r.data.find((c) => c.id === contactId);
          if (contact) setActive(contact);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    api.get(`/messages/${active.id}`).then((r) => setMessages(r.data.messages ?? [])).catch(() => {});
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !active) return;
    setSending(true);
    const content = text.trim();
    try {
      const res = await api.post('/messages', { receiverId: active.id, content });
      setMessages((prev) => [...prev, res.data]);
      setText('');
      setConversations((prev) =>
        prev.map((c) =>
          c.id === active.id
            ? { ...c, lastMessage: { content, createdAt: new Date().toISOString() } }
            : c
        )
      );
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const filtered = conversations.filter((c) =>
    `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Messages</h1>
          <p className="text-sm text-slate-500 mt-1">Échangez en privé avec vos voisins</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`size-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          <span className={connected ? 'text-emerald-400' : 'text-slate-600'}>
            {connected ? 'Temps réel actif' : 'Hors ligne'}
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-white/8 overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: 480 }}>
        <div className="flex h-full">
          {/* Conversations */}
          <div className="w-72 border-r border-white/8 flex flex-col shrink-0">
            <div className="p-3 border-b border-white/8">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-800 border border-white/8 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600 transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="flex gap-3 animate-pulse"><div className="size-10 bg-slate-800 rounded-full shrink-0" /><div className="flex-1 space-y-1.5"><div className="h-3 bg-slate-800 rounded w-3/4" /><div className="h-2.5 bg-slate-800/60 rounded w-1/2" /></div></div>)}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                  <MessageSquare size={28} className="text-slate-700" />
                  <p className="text-sm text-slate-500 font-medium">Aucun voisin</p>
                  <p className="text-xs text-slate-600">Rejoignez un quartier pour discuter avec vos voisins.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                  <MessageSquare size={28} className="text-slate-700" />
                  <p className="text-sm text-slate-600">Aucun résultat</p>
                </div>
              ) : filtered.map((c) => {
                const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
                const isActive = active?.id === c.id;
                return (
                  <button key={c.id} onClick={() => setActive(c)}
                    className={['w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors', isActive ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'hover:bg-white/5 border-l-2 border-transparent'].join(' ')}>
                    <Avatar name={name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={['text-sm truncate', isActive ? 'font-semibold text-indigo-300' : 'font-medium text-white'].join(' ')}>{name}</span>
                        {c.lastMessage?.createdAt && <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(c.lastMessage.createdAt)}</span>}
                      </div>
                      {c.lastMessage?.content && <p className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessage.content}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat */}
          {active ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/8 shrink-0">
                <Avatar name={`${active.firstName ?? ''} ${active.lastName ?? ''}`} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-white">{active.firstName} {active.lastName}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((m, i) => {
                  const isMe = m.isMe ?? m.senderId === user?.id;
                  return (
                    <div key={m.id ?? i} className={['flex', isMe ? 'justify-end' : 'justify-start'].join(' ')}>
                      {!isMe && <Avatar name={`${active.firstName ?? ''} ${active.lastName ?? ''}`} size="xs" className="mr-2 mt-1 shrink-0" />}
                      <div className={['max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed', isMe ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-sm shadow-sm shadow-indigo-500/20' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-white/5'].join(' ')}>
                        {m.content}
                        <p className={['text-[10px] mt-1', isMe ? 'text-indigo-200' : 'text-slate-500'].join(' ')}>{m.createdAt ? timeAgo(m.createdAt) : ''}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="px-4 py-3 border-t border-white/8 flex items-end gap-3 shrink-0">
                <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey}
                  placeholder="Votre message..." rows={1}
                  className="flex-1 resize-none rounded-xl border border-white/8 bg-slate-800 text-white px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  style={{ maxHeight: 120 }}
                />
                <button onClick={send} disabled={!text.trim() || sending}
                  className="size-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-40 text-white rounded-xl transition-all shrink-0 shadow-sm shadow-indigo-500/30">
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/8">
                <MessageSquare size={28} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Sélectionnez une conversation</p>
              <p className="text-sm text-slate-600">Choisissez un voisin pour commencer à discuter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
