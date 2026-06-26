import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, User, Shield, Bell, CreditCard, 
  Award, LifeBuoy, HelpCircle, LogOut, Navigation2 
} from 'lucide-react';
import { GlobalHeader } from '@/components/GlobalHeader';

export function ResidentSettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { label: 'Main Hub', path: '/resident/settings', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Personal Profile', path: '/resident/settings/profile', icon: <User className="w-5 h-5" /> },
    { label: 'Access Management', path: '/resident/settings/access', icon: <Navigation2 className="w-5 h-5" /> },
    { label: 'Security', path: '/resident/settings/security', icon: <Shield className="w-5 h-5" /> },
    { label: 'Notifications', path: '/resident/settings/notifications', icon: <Bell className="w-5 h-5" /> },
    { label: 'Payments', path: '/resident/settings/payments', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Community Vouches', path: '/resident/settings/vouches', icon: <Award className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1d2630] border-r border-[#2a3441] hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto">
        {/* User Info */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a3441] border border-[#374151] flex items-center justify-center">
            {/* We'll use a placeholder if no avatar */}
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Resident Account</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1">Verified Member</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            // Exact match for the hub, prefix match for others
            const isActive = item.path === '/resident/settings' 
              ? location.pathname === '/resident/settings' 
              : location.pathname.startsWith(item.path);
              
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive 
                    ? 'bg-[#154656] text-white border-l-4 border-[#238fa9] pl-3' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-[#2a3441] flex flex-col gap-2">
          <button 
            onClick={() => navigate('/resident/emergency')}
            className="w-full bg-[#c82424] text-white hover:bg-[#a61c1c] px-4 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 mb-2"
          >
            <LifeBuoy className="w-4 h-4" /> Emergency Support
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-semibold transition-colors">
            <HelpCircle className="w-5 h-5" /> Help Center
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        <GlobalHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
