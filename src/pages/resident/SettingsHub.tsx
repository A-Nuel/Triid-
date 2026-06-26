import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, CreditCard, Bell, Award, MapPin, Building, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function SettingsHub() {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!session) return;
      try {
        const res = await fetch('/api/v1/resident/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const { profile: p, user: u } = await res.json();
          setProfile({ ...p, email: u?.email });
        }
      } catch (err) {
        console.error("Failed to load resident profile", err);
      }
    }
    loadData();
  }, [session]);

  const cards = [
    {
      title: 'Personal Info',
      desc: 'Update your contact details, emergency contacts, and...',
      icon: <User className="w-5 h-5 text-[#1b4f63]" />,
      path: '/resident/settings/profile'
    },
    {
      title: 'Security',
      desc: 'Manage passwords, two-factor authentication, and...',
      icon: <Shield className="w-5 h-5 text-[#1b4f63]" />,
      path: '/resident/settings/security'
    },
    {
      title: 'Saved Addresses',
      desc: 'Manage frequent visitor destinations and delivery...',
      icon: <Building className="w-5 h-5 text-[#1b4f63]" />,
      path: '/resident/settings/access'
    },
    {
      title: 'Payment Methods',
      desc: 'Manage cards, view transaction history, and...',
      icon: <CreditCard className="w-5 h-5 text-[#1b4f63]" />,
      path: '/resident/settings/payments'
    },
    {
      title: 'Notification Settings',
      desc: 'Control alerts for visitors, announcements, and...',
      icon: <Bell className="w-5 h-5 text-[#1b4f63]" />,
      path: '/resident/settings/notifications'
    },
    {
      title: 'My Vouches',
      desc: 'Review history of community vouches and...',
      icon: <Award className="w-5 h-5 text-[#1b4f63]" />,
      path: '/resident/settings/vouches'
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#1b4f63] flex items-center justify-center text-white text-3xl font-bold uppercase shadow-inner relative">
            {profile?.username?.charAt(0) || profile?.email?.charAt(0) || 'R'}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile?.username || 'Resident'}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm font-semibold">
              <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                <CheckCircle2 className="w-4 h-4" /> Verified Resident
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-4 h-4" /> {profile?.estate_name || 'Redemption City'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/resident/settings/profile')}
          className="px-6 py-2.5 bg-[#001f29] hover:bg-black text-white font-bold rounded-lg transition-colors text-sm"
        >
          Edit Profile
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col text-left hover:border-[#1b4f63] hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#f0f4f8] flex items-center justify-center group-hover:bg-[#e1eaef] transition-colors">
                {card.icon}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#1b4f63] transition-colors" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{card.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{card.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
