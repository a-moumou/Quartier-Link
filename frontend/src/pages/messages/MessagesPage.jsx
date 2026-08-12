import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, MessageSquare, ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import mqtt from 'mqtt';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MQTT_URL = import.meta.env.VITE_MQTT_URL ?? 'ws://localhost:9001';

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'À l\'instant';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} j`;
}

function StatusBadge({ connected }) {
  return (
    <div
      className={[
        'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border',
        connected
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-[#21262d] text-[#8b949e] border-[#30363d]',
      ].join(' ')}
    >
      {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
      {connected ? 'Temps réel' : 'Hors ligne'}
    </div>
  );
}

function ConversationList({
  loading, conversations, filtered, search, onSearch, onSelect, activeId,
}) {
  return (
    <>
      <div className="relative p-3 border-b border-[#30363d]">
        <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#6e7681]" />
        <input
          type="text"
          placeholder="Rechercher un voisin..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-[#0f1117] border border-[#30363d] text-[#e6edf3] rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder:text-[#6e7681] transition-colors"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-md p-2.5 flex gap-3 animate-pulse">
              <div className="size-9 bg-[#21262d] rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#21262d] rounded w-2/3" />
                <div className="h-2 bg-[#21262d] rounded w-1/2" />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
            <MessageSquare size={26} className="text-[#6e7681]" />
            <p className="text-sm text-[#e6edf3] font-medium">Aucun contact</p>
            <p className="text-xs text-[#8b949e]">Rejoignez un quartier pour discuter.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#8b949e]">Aucun résultat</div>
        ) : (
          filtered.map((c) => {
            const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
            const isActive = activeId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={[
                  'w-full rounded-md p-2.5 flex items-center gap-2.5 text-left transition-colors',
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'hover:bg-[#21262d] border border-transparent',
                ].join(' ')}
              >
                <Avatar name={name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={[
                      'text-sm truncate',
                      isActive ? 'text-emerald-300 font-semibold' : 'text-[#e6edf3] font-medium',
                    ].join(' ')}>{name}</span>
                    {c.lastMessage?.createdAt && (
                      <span className="text-[10px] text-[#8b949e] shrink-0">
                        {timeAgo(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {c.lastMessage?.content && (
                    <p className="text-xs text-[#8b949e] truncate mt-0.5">{c.lastMessage.content}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

function ChatPanel({
  active, activeName, messages, user, connected, text, onText, onSend, onKey, sending, onBack, showBack,
}) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!active) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <div className="size-14 bg-[#21262d] border border-[#30363d] rounded-md flex items-center justify-center">
          <MessageSquare size={24} className="text-[#8b949e]" />
        </div>
        <p className="text-[#e6edf3] font-medium">Sélectionnez une conversation</p>
        <p className="text-sm text-[#8b949e]">Choisissez un voisin pour commencer à discuter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d] shrink-0 bg-[#0f1117]/40">
        {showBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-md hover:bg-[#21262d] text-[#8b949e] transition-colors"
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <Avatar name={activeName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#e6edf3] truncate">{activeName}</p>
          <p className="text-[10px] text-[#8b949e]">
            {connected ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d1017]">
        {messages.map((m, i) => {
          const isMe = m.isMe ?? m.senderId === user?.id;
          return (
            <div
              key={m.id ?? i}
              className={['flex', isMe ? 'justify-end' : 'justify-start'].join(' ')}
            >
              {!isMe && (
                <Avatar name={activeName} size="xs" className="mr-2 mt-1 shrink-0" />
              )}
              <div
                className={[
                  'max-w-[75%] rounded-lg px-3.5 py-2 text-sm leading-relaxed border',
                  isMe
                    ? 'bg-emerald-500 text-white border-emerald-500 rounded-br-sm'
                    : 'bg-[#161b22] text-[#e6edf3] border-[#30363d] rounded-bl-sm',
                ].join(' ')}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={[
                  'text-[10px] mt-1',
                  isMe ? 'text-emerald-100/80' : 'text-[#8b949e]',
                ].join(' ')}>
                  {m.createdAt ? timeAgo(m.createdAt) : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[#30363d] flex items-end gap-2 shrink-0 bg-[#161b22]">
        <textarea
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Votre message..."
          rows={1}
          className="flex-1 resize-none rounded-md border border-[#30363d] bg-[#0f1117] text-[#e6edf3] px-3 py-2 text-sm placeholder:text-[#6e7681] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          style={{ maxHeight: 120 }}
        />
        <Button onClick={onSend} disabled={!text.trim() || sending} className="size-9 !px-0 shrink-0">
          <Send size={15} />
        </Button>
      </div>
    </>
  );
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
  const activeRef = useRef(null);
  const mqttRef = useRef(null);

  useEffect(() => { activeRef.current = active; }, [active]);

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

        if (currentActive?.id === msg.senderId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, isMe: false }];
          });
        }

        setConversations((prev) => {
          const exists = prev.find((c) => c.id === msg.senderId);
          if (exists) {
            return prev.map((c) =>
              c.id === msg.senderId
                ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt } }
                : c
            );
          }
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
        const contactId = location.state?.contactId;
        if (contactId) {
          const contact = r.data.find((c) => c.id === contactId);
          if (contact) setActive(contact);
        } else if (r.data.length > 0 && window.innerWidth >= 1024) {
          setActive(r.data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    api.get(`/messages/${active.id}`).then((r) => setMessages(r.data.messages ?? [])).catch(() => {});
  }, [active]);

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
    } catch { /* ignore */ } finally { setSending(false); }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const filtered = conversations.filter((c) =>
    `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const activeName = active ? `${active.firstName ?? ''} ${active.lastName ?? ''}`.trim() : '';

  const chatProps = {
    active,
    activeName,
    messages,
    user,
    connected,
    text,
    onText: setText,
    onSend: send,
    onKey,
    sending,
    onBack: () => setActive(null),
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Messages</h1>
            <p className="text-sm text-[#8b949e] mt-0.5">Échangez en privé avec vos voisins</p>
          </div>
          <StatusBadge connected={connected} />
        </div>

        <div
          className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex"
          style={{ height: 'calc(100vh - 11rem)' }}
        >
          <div className="w-80 border-r border-[#30363d] flex flex-col shrink-0">
            <ConversationList
              loading={loading}
              conversations={conversations}
              filtered={filtered}
              search={search}
              onSearch={setSearch}
              onSelect={setActive}
              activeId={active?.id}
            />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <ChatPanel {...chatProps} showBack={false} />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden relative" style={{ minHeight: 'calc(100dvh - 10rem)' }}>
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#8b949e]">
                  {conversations.length} contact{conversations.length !== 1 ? 's' : ''}
                </p>
                <StatusBadge connected={connected} />
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7681]" />
                <input
                  type="text"
                  placeholder="Rechercher un voisin..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0f1117] border border-[#30363d] text-[#e6edf3] rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder:text-[#6e7681] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-md p-3 flex gap-3 animate-pulse">
                      <div className="size-10 bg-[#21262d] rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-[#21262d] rounded w-2/3" />
                        <div className="h-2 bg-[#21262d] rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : conversations.length === 0 ? (
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
                    <MessageSquare size={28} className="text-[#6e7681] mx-auto mb-3" />
                    <p className="text-sm text-[#e6edf3] font-medium">Aucun contact</p>
                    <p className="text-xs text-[#8b949e] mt-1">Rejoignez un quartier pour discuter.</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
                    <p className="text-sm text-[#8b949e]">Aucun résultat</p>
                  </div>
                ) : (
                  filtered.map((c) => {
                    const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActive(c)}
                        className="w-full bg-[#161b22] border border-[#30363d] rounded-md p-3 flex items-center gap-3 text-left ql-hover-border transition-colors"
                      >
                        <Avatar name={name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#e6edf3] truncate">{name}</span>
                            {c.lastMessage?.createdAt && (
                              <span className="text-[10px] text-[#8b949e] shrink-0">
                                {timeAgo(c.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          {c.lastMessage?.content && (
                            <p className="text-xs text-[#8b949e] truncate mt-0.5">{c.lastMessage.content}</p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 right-0 top-14 bottom-16 z-30 flex flex-col"
            >
              <div className="bg-[#161b22] flex flex-col h-full mx-4 my-2 border border-[#30363d] rounded-xl overflow-hidden">
                <ChatPanel {...chatProps} showBack />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
