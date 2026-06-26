import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Phone, MoreVertical, Paperclip, Camera, MessageSquare, CheckCheck, Check, ShieldCheck, ArrowLeft, ExternalLink, Mic, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
  message_type?: string;
  sender?: { id: string; full_name: string; };
}

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
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (diffDays < 7) return days[date.getDay()];
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

const getCategoryColor = (category?: string) => {
  const cat = category?.toLowerCase();
  if (cat === 'electrical') return 'bg-yellow-100 text-yellow-700';
  if (cat === 'plumbing') return 'bg-blue-100 text-blue-700';
  if (cat === 'generator') return 'bg-orange-100 text-orange-700';
  if (cat === 'hvac') return 'bg-cyan-100 text-cyan-700';
  if (cat === 'locksmith') return 'bg-purple-100 text-purple-700';
  if (cat === 'security') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

const getStatusColor = (status?: string) => {
  const s = status?.toLowerCase();
  if (s === 'in_progress') return 'text-blue-600 bg-blue-50';
  if (s === 'accepted' || s === 'matched') return 'text-orange-600 bg-orange-50';
  if (s === 'completed' || s === 'confirmed') return 'text-green-600 bg-green-50';
  return 'text-gray-600 bg-gray-50';
};

export function ResidentMessaging() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { prefillMessage?: string, artisanId?: string, artisanName?: string } | null;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [jobDetail, setJobDetail] = useState<any>(null);
  const [input, setInput] = useState(locationState?.prefillMessage || '');
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

  const loadConversations = useCallback(async () => {
    if (!session || !user) return;
    try {
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*, sender:sender_id(full_name), receiver:receiver_id(full_name)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (allMessages) {
        const grouped = new Map<string, Conversation>();
        for (const m of allMessages) {
          if (!grouped.has(m.job_id)) {
            const isSender = m.sender_id === user.id;
            const partnerId = isSender ? m.receiver_id : m.sender_id;
            const partnerName = isSender ? m.receiver?.full_name : m.sender?.full_name;
            
            grouped.set(m.job_id, {
              jobId: m.job_id,
              partnerId,
              partnerName: partnerName || 'User',
              lastMessage: m.content,
              lastMessageAt: m.created_at,
              unreadCount: 0,
            });
          }
        }

        const cArray = Array.from(grouped.values());
        if (cArray.length > 0) {
          const { data: jobs } = await supabase.from('jobs').select('id, category, description, status').in('id', cArray.map(c => c.jobId));
          if (jobs) {
            for (const c of cArray) {
              c.job = jobs.find(j => j.id === c.jobId);
            }
          }
        }
        
        if (locationState?.artisanId && locationState?.prefillMessage) {
          const existing = cArray.find(c => c.partnerId === locationState.artisanId);
          if (existing) {
             setSelectedConv(existing);
          } else {
             const dummyConv: Conversation = {
               jobId: 'quote_request',
               partnerId: locationState.artisanId,
               partnerName: locationState.artisanName || 'Artisan',
               lastMessage: locationState.prefillMessage,
               lastMessageAt: new Date().toISOString(),
               unreadCount: 0,
               job: { id: 'quote_request', category: 'other', description: 'Quote Request', status: 'pending' }
             };
             cArray.unshift(dummyConv);
             setSelectedConv(dummyConv);
          }
        }

        setConversations(cArray.sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvs(false);
    }
  }, [session, user, locationState]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (conv: Conversation) => {
    if (!session) return;
    setLoadingMsgs(true);
    if (conv.jobId === 'quote_request') {
      setMessages([]);
      setJobDetail(conv.job);
      setLoadingMsgs(false);
      return;
    }
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:sender_id(id, full_name)')
        .eq('job_id', conv.jobId)
        .order('created_at', { ascending: true });
      
      const { data: job } = await supabase.from('jobs').select('*').eq('id', conv.jobId).single();
      
      setMessages(msgs || []);
      setJobDetail(job);
    } catch {}
    finally { setLoadingMsgs(false); }
  }, [session]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
    }
  }, [selectedConv, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!selectedConv || !user || selectedConv.jobId === 'quote_request') return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`messages:${selectedConv.jobId}:resident`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `job_id=eq.${selectedConv.jobId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, user, scrollToBottom]);

  const sendMessage = async (text?: string) => {
    if ((!text && !input.trim()) || !selectedConv || !user) return;
    const contentToSend = text || input.trim();
    setSending(true);

    try {
      if (selectedConv.jobId === 'quote_request') {
         // Create a job first
         const position = await new Promise<GeolocationPosition | null>((resolve) => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 });
            } else {
              resolve(null);
            }
         });
         
         const locStr = position 
            ? `POINT(${position.coords.longitude} ${position.coords.latitude})` 
            : 'POINT(3.3792 6.5244)';

         const { data: job, error: jobError } = await supabase.from('jobs').insert({
            resident_id: user.id,
            artisan_id: selectedConv.partnerId,
            mode: 'scheduled',
            category: 'other',
            description: 'Resident requested a quote.',
            location: locStr,
            status: 'pending'
         }).select('id').single();
         
         if (jobError) throw jobError;
         
         // Now send message
         await fetch('/api/v1/messages', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
           body: JSON.stringify({ job_id: job.id, receiver_id: selectedConv.partnerId, content: contentToSend })
         });
         
         // Update the selected conversation ID
         selectedConv.jobId = job.id;
         
      } else {
         await fetch('/api/v1/messages', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
           body: JSON.stringify({ job_id: selectedConv.jobId, receiver_id: selectedConv.partnerId, content: contentToSend })
         });
      }
      if (!text) setInput('');
      scrollToBottom();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(search.toLowerCase()) ||
    c.job?.category?.toLowerCase().includes(search.toLowerCase())
  );

  const messageGroups = groupMessagesByDate(messages);
  const jobInfo = jobDetail || selectedConv?.job;

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
      {/* Top Bar (Mobile) */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/resident/dashboard')} className="p-1 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Messages</h1>
      </header>

      <div className="flex-1 flex max-w-6xl w-full mx-auto" style={{ height: 'calc(100vh - 0px)' }}>
        {/* Conversation List */}
        <div className={`w-full md:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-5 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3 hidden md:block">Messages</h2>
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

          <div className="flex-1 overflow-y-auto">
            {loadingConvs && conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading conversations...</div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
                <p className="text-xs text-gray-400">Messages from your artisans will appear here once a job is active.</p>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <button
                  key={conv.jobId}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full flex items-start gap-3 px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${selectedConv?.jobId === conv.jobId ? 'bg-blue-50 border-l-2 border-l-[#1b4f63]' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#1b4f63] flex items-center justify-center text-white font-bold uppercase shadow-sm">
                      {conv.partnerName.charAt(0)}
                    </div>
                    {/* Online dot */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white"></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold text-sm text-gray-900 truncate">{conv.partnerName}</span>
                      <span className="text-[10px] text-gray-400 ml-1 flex-shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1.5">{conv.lastMessage}</p>
                    {conv.job?.category && (
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${getCategoryColor(conv.job.category)}`}>
                        {conv.job.category.charAt(0).toUpperCase() + conv.job.category.slice(1)} {conv.job.category === 'generator' ? 'Repair' : conv.job.category === 'electrical' ? '' : ''}
                      </span>
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
          <div className="flex-1 flex flex-col bg-gray-50 min-w-0 border-r border-gray-200">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center gap-3 shadow-sm">
              <button onClick={() => setSelectedConv(null)} className="md:hidden p-1 -ml-1 text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#1b4f63] flex items-center justify-center text-white font-bold uppercase">
                  {selectedConv.partnerName.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">{selectedConv.partnerName}</h3>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                    <ShieldCheck className="w-3 h-3" /> Verified Artisan
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Job Context Bar */}
            {jobInfo && (
              <div className="bg-gray-100 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sm">🔧</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 capitalize truncate">
                    {jobInfo.category?.charAt(0).toUpperCase() + jobInfo.category?.slice(1)} Maintenance & Repair
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500">Job ID: TRD-{jobInfo.id?.slice(0, 8).toUpperCase()}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${getStatusColor(jobInfo.status)}`}>
                      ● {jobInfo.status === 'in_progress' ? 'In Progress' : jobInfo.status === 'accepted' ? 'En Route' : jobInfo.status || 'Active'}
                    </span>
                  </div>
                </div>
                <button className="text-xs font-bold text-[#1b4f63] flex items-center gap-1 hover:underline flex-shrink-0">
                  View Details <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
              {loadingMsgs && messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <MessageSquare className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start a conversation with your artisan.</p>
                  </div>
                </div>
              ) : (
                messageGroups.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-white border border-gray-200 text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
                        {group.label}
                      </span>
                    </div>
                    {group.messages.map(msg => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 items-end gap-2`}>
                          {!isOwn && (
                            <div className="w-7 h-7 rounded-full bg-[#1b4f63] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {selectedConv.partnerName.charAt(0)}
                            </div>
                          )}
                          <div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isOwn
                                ? 'bg-[#1b4f63] text-white rounded-br-sm'
                                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                            }`}>
                              {msg.message_type === 'offer' ? (
                                <div className="flex flex-col gap-2 min-w-[200px]">
                                  <div className="font-bold border-b border-white/20 pb-1 mb-1">Booking Request</div>
                                  <div className="whitespace-pre-wrap text-sm opacity-90">{msg.content.replace('Booking Offer:\n', '')}</div>
                                  {jobInfo?.status === 'pending' && (
                                    <div className="mt-2 text-xs italic opacity-80">Waiting for artisan to accept...</div>
                                  )}
                                  {jobInfo?.status === 'matched' && (
                                    <button 
                                      onClick={() => navigate(`/resident/emergency/payment/${msg.job_id}`)}
                                      className="mt-3 bg-white text-[#1b4f63] py-2 px-4 rounded-lg font-bold text-xs hover:bg-gray-100 transition-colors w-full shadow-sm"
                                    >
                                      Review & Pay to Escrow
                                    </button>
                                  )}
                                  {jobInfo?.status === 'cancelled' && (
                                    <div className="mt-2 text-xs font-bold text-red-200 bg-red-900/30 py-1 px-2 rounded">Offer Declined</div>
                                  )}
                                </div>
                              ) : msg.content.startsWith('[IMAGE]') ? (
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

            {/* Input Bar */}
            <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex items-center gap-3">
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
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={uploadingMedia ? "Uploading..." : "Type your message here..."}
                  disabled={uploadingMedia}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4f63]/30 focus:border-[#1b4f63] shadow-sm disabled:bg-gray-50"
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
                  onClick={() => sendMessage()}
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
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center p-12 gap-4">
            <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-9 h-9 text-gray-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-700">Your messages</h2>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">Select a conversation to view your messages with your artisans.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
