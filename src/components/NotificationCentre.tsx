import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Briefcase, DollarSign, MessageSquare, Megaphone, CheckCircle2, BellRing } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationCentre() {
  const { session } = useAuth();
  const { isSubscribed, permission, subscribe } = usePushNotifications();
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Jobs' | 'System'>('All');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      if (!session) return;
      try {
        const res = await fetch('/api/v1/notifications', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const { notifications: data } = await res.json();
          setNotifications(data || []);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    loadNotifications();
  }, [session]);

  const markAllAsRead = async () => {
    if (!session) return;
    try {
      await fetch('/api/v1/notifications/read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Jobs') return n.type === 'job' || n.type === 'payment';
    if (filter === 'System') return n.type === 'system' || n.type === 'alert';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'job': return <Briefcase className="w-5 h-5 text-green-600" />;
      case 'payment': return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-gray-600" />;
      case 'system': return <Megaphone className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-[#f0f4f8] border-transparent';
    switch (type) {
      case 'alert': return 'bg-white border-l-4 border-l-red-500 shadow-sm';
      case 'job': return 'bg-white border-l-4 border-l-green-500 shadow-sm';
      case 'payment': return 'bg-white border-l-4 border-l-[#1b4f63] shadow-sm';
      default: return 'bg-white border-l-4 border-l-gray-300 shadow-sm';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {(!isSubscribed && permission !== 'denied') && (
        <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-800">
            <BellRing className="w-5 h-5" />
            <div>
              <p className="font-bold text-sm">Enable Push Notifications</p>
              <p className="text-xs opacity-90">Get instantly notified about job updates and new messages.</p>
            </div>
          </div>
          <button onClick={subscribe} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
            Enable
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Centre</h1>
          <p className="text-gray-500 mt-2">Review and manage your latest alerts and system messages.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="text-sm font-bold text-[#1b4f63] hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex gap-3 mb-8">
        {['All', 'Unread', 'Jobs', 'System'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === f 
                ? 'bg-[#001f29] text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notifications found.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const [title, ...msgParts] = (n.content || '').split(':');
            const message = msgParts.join(':') || title;
            const displayTitle = msgParts.length > 0 ? title : n.type.toUpperCase();
            return (
            <div key={n.id} className={`p-5 rounded-2xl border ${getBg(n.type, n.is_read)} flex gap-4 transition-all relative`}>
              <div className="w-10 h-10 rounded-full bg-[#f8fafc] flex flex-shrink-0 items-center justify-center border border-gray-100">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 pr-12">
                <h4 className="font-bold text-gray-900 text-sm mb-1">{displayTitle}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
              </div>
              <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                <span className="text-xs text-gray-400 font-medium">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
