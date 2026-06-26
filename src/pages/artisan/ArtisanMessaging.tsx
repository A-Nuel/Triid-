import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Phone, MoreVertical, Paperclip, ChevronRight, MessageSquare, Zap, CheckCheck, Check, Camera, Mic, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadMedia } from '@/lib/mediaUpload';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface Conversation {
  jobId: string;
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  job?: { id: string; category: string; description: string; status: string; };
}

interface Message {
  id: string;
  job_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_id: string;
  receiver_id: string;
  sender?: { id: string; full_name: string; };
}

const QUICK_REPLIES = [
  "I'm on my way",
  "I have arrived",
  "Could you provide gate access?",
  "Job is complete",
  "Need a few more minutes",
];

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  let currentLabel = '';
  for (const msg of messages) {
    const date = new Date(msg.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (date.toDateString() === today.toDateString()) label = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export function ArtisanMessaging() {
  const { user, session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [jobDetail, setJobDetail] = useState<any>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const url = await uploadMedia(file);
      await sendMessage(`[IMAGE] ${url}`);
    } catch (err) {
      alert("Failed to upload media");
    } finally {
      setUploadingMedia(false);
    }
    e.target.value = '';
  };

  const handleSendVoiceNote = async () => {
    const blob = await stopRecording();
    if (!blob) return;
    setUploadingMedia(true);
    try {
      const url = await uploadMedia(blob);
      await sendMessage(`[AUDIO] ${url}`);
    } catch (err) {
      alert("Failed to send voice note");
    } finally {
      setUploadingMedia(false);
    }
  };
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/v1/messages/conversations', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const { conversations } = await res.json();
        setConversations(conversations || []);
        // Cache for offline
        if (user) localStorage.setItem(`triid_msg_convs_${user.id}`, JSON.stringify(conversations || []));
      }
    } catch {
      // Offline — load from cache
      if (user) {
        const cached = localStorage.getItem(`triid_msg_convs_${user.id}`);
        if (cached) setConversations(JSON.parse(cached));
      }
    } finally {
      setLoadingConvs(false);
    }
  }, [session, user]);

  useEffect(() => {
    // Show cached immediately
    if (user) {
      const cached = localStorage.getItem(`triid_msg_convs_${user.id}`);
      if (cached) { try { setConversations(JSON.parse(cached)); setLoadingConvs(false); } catch {} }
    }
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conv: Conversation) => {
    if (!session) return;
    setLoadingMsgs(true);
    // Show cached immediately
    const cacheKey = `triid_msg_thread_${conv.jobId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { const parsed = JSON.parse(cached); setMessages(parsed); setLoadingMsgs(false); }
    } catch {}
    try {
      const res = await fetch(`/api/v1/messages/${conv.jobId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const { messages: msgs, job } = await res.json();
        setMessages(msgs || []);
        setJobDetail(job);
        localStorage.setItem(cacheKey, JSON.stringify(msgs || []));
        // Mark conversation as read
        setConversations(prev => prev.map(c => c.jobId === conv.jobId ? { ...c, unreadCount: 0 } : c));
      }
    } catch {
      // offline — use cached
    } finally {
      setLoadingMsgs(false);
    }
  }, [session]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
    }
  }, [selectedConv, loadMessages]);

  // Scroll to bottom when messages load
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!selectedConv || !user) return;

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${selectedConv.jobId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `job_id=eq.${selectedConv.jobId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          localStorage.setItem(`triid_msg_thread_${selectedConv.jobId}`, JSON.stringify(updated));
          return updated;
        });
        // Update conversation list last message
        setConversations(prev => prev.map(c => c.jobId === selectedConv.jobId
          ? { ...c, lastMessage: newMsg.content, lastMessageAt: newMsg.created_at }
          : c
        ));
        setTimeout(scrollToBottom, 50);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, user, scrollToBottom]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConv || !session || sending) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      job_id: selectedConv.jobId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
      sender_id: user!.id,
      receiver_id: selectedConv.partnerId,
      sender: { id: user!.id, full_name: user!.email || 'You' },
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          job_id: selectedConv.jobId,
          receiver_id: selectedConv.partnerId,
          content: content.trim(),
        }),
      });
      if (res.ok) {
        const { message } = await res.json();
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m.id === tempId ? message : m));
        setConversations(prev => prev.map(c => c.jobId === selectedConv.jobId
          ? { ...c, lastMessage: message.content, lastMessageAt: message.created_at }
          : c
        ));
      }
    } catch {
      // Offline — keep optimistic, will retry
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(search.toLowerCase()) ||
    c.job?.category?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'in_progress') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">In Progress</span>;
    if (s === 'accepted' || s === 'matched') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700">En Route</span>;
    if (s === 'completed' || s === 'confirmed') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">Completed</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600">{status || 'Active'}</span>;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Empty state — no conversations
  if (!loadingConvs && conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-4">
        <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-on-surface-variant" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">No messages yet</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">Messages from residents about active jobs will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Conversation List Panel */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-surface-variant bg-white flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-surface-variant">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4f63]/30 focus:border-[#1b4f63]"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs && conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Loading conversations...</div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">No conversations found</div>
          ) : (
            filteredConvs.map(conv => (
              <button
                key={conv.jobId}
                onClick={() => setSelectedConv(conv)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${selectedConv?.jobId === conv.jobId ? 'bg-blue-50 border-l-2 border-l-[#1b4f63]' : ''}`}
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-[#1b4f63] flex-shrink-0 flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm">
                  {conv.partnerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-sm text-gray-900 truncate">{conv.partnerName}</span>
                    <span className="text-[10px] text-gray-400 ml-1 flex-shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                  {conv.job?.category && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-full capitalize">{conv.job.category}</span>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#1b4f63] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {conv.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 shadow-sm">
            <button
              onClick={() => setSelectedConv(null)}
              className="md:hidden p-1 -ml-1 text-gray-500"
            >
              ←
            </button>
            <div className="w-10 h-10 rounded-full bg-[#1b4f63] flex items-center justify-center text-white font-bold uppercase shadow-sm">
              {selectedConv.partnerName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{selectedConv.partnerName}</h3>
              <span className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Job Context Bar */}
          {(jobDetail || selectedConv.job) && (
            <div className="bg-white border-b border-gray-100 px-5 py-2.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Job</span>
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[10px] font-bold text-gray-400">REQ-{selectedConv.jobId.slice(0, 4).toUpperCase()}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate capitalize">
                  {(jobDetail || selectedConv.job)?.description?.slice(0, 50) || (jobDetail || selectedConv.job)?.category}
                </p>
              </div>
              {getStatusBadge((jobDetail || selectedConv.job)?.status)}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
            {loadingMsgs && messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No messages yet. Start the conversation!</div>
            ) : (
              messageGroups.map(group => (
                <div key={group.label}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-white border border-gray-100 text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
                      {group.label}
                    </div>
                  </div>
                  {group.messages.map(msg => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 items-end gap-2`}>
                        {!isOwn && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                            {selectedConv.partnerName.charAt(0)}
                          </div>
                        )}
                        <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-[#1b4f63] text-white rounded-br-sm'
                              : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                          }`}>
                            {msg.content.startsWith('[IMAGE]') ? (
                              <a href={msg.content.replace('[IMAGE] ', '')} target="_blank" rel="noreferrer">
                                <img src={msg.content.replace('[IMAGE] ', '')} alt="Attachment" className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
                              </a>
                            ) : msg.content.startsWith('[AUDIO]') ? (
                              <audio controls src={msg.content.replace('[AUDIO] ', '')} className="h-10 w-[200px]" />
                            ) : (
                              msg.content
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                            {isOwn && (
                              msg.is_read
                                ? <CheckCheck className="w-3 h-3 text-blue-400" />
                                : <Check className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK_REPLIES.map(reply => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="whitespace-nowrap px-3.5 py-1.5 border border-gray-200 bg-white rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-[#1b4f63] transition-colors flex-shrink-0 shadow-sm"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
            <label className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer relative">
              <Paperclip className="w-5 h-5" />
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingMedia || isRecording} />
            </label>
            <label className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer relative">
              <Camera className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploadingMedia || isRecording} />
            </label>
            
            {isRecording ? (
              <div className="flex-1 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 font-medium animate-pulse">
                  <Mic className="w-4 h-4" /> Recording ({recordingTime}s)
                </div>
                <button onClick={cancelRecording} className="p-1 hover:bg-red-100 rounded-full text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={uploadingMedia ? "Uploading..." : "Type a message..."}
                disabled={uploadingMedia}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4f63]/30 focus:border-[#1b4f63] resize-none disabled:bg-gray-100"
              />
            )}

            {isRecording ? (
              <button
                onClick={handleSendVoiceNote}
                disabled={uploadingMedia}
                className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all flex-shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : input.trim() ? (
              <button
                onClick={() => sendMessage(input)}
                disabled={sending || uploadingMedia}
                className="w-10 h-10 rounded-xl bg-[#1b4f63] text-white flex items-center justify-center hover:bg-[#003849] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={uploadingMedia}
                className="w-10 h-10 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-all flex-shrink-0 shadow-sm"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        // No conversation selected — desktop empty state
        <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center p-12 gap-4 bg-gray-50">
          <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <MessageSquare className="w-9 h-9 text-gray-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-700">Select a conversation</h2>
            <p className="text-sm text-gray-400 mt-1">Choose a conversation from the left to start messaging.</p>
          </div>
        </div>
      )}
    </div>
  );
}
