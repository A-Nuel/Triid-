import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Zap, Wallet, Settings, LogOut, Bell, MessageSquare, BarChart2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ArtisanLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };
  
  const navItems = [
    { label: 'Dashboard', path: '/artisan/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Service Requests', path: '/artisan/requests', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Emergency Dispatch', path: '/artisan/dashboard', icon: <Zap className="w-5 h-5" />, highlight: true },
    { label: 'Messaging', path: '/artisan/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Wallet', path: '/artisan/wallet', icon: <Wallet className="w-5 h-5" /> },
    { label: 'Analytics', path: '/artisan/reports', icon: <BarChart2 className="w-5 h-5" /> },
    { label: 'Notifications', path: '/artisan/notifications', icon: <Bell className="w-5 h-5" /> },
    { label: 'Settings', path: '/artisan/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-surface-bright flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-bright border-r border-surface-variant flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-space-6 flex flex-col gap-1">
          <h1 className="text-xl font-bold text-primary tracking-tight">Triid Marketplace</h1>
          <p className="text-xs text-on-surface-variant">Gated Community Portal</p>
        </div>
        
        <nav className="flex-1 px-space-4 py-space-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/artisan/dashboard' && location.pathname.startsWith(item.path));
            if (item.highlight) {
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-space-3 px-space-4 py-space-3 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors mt-1"
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            }
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-space-3 px-space-4 py-space-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#1b4f63] text-white' 
                    : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>
        
        <div className="p-space-4 border-t border-surface-variant">
          <button 
            onClick={handleSignOut}
            className="w-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-space-4 py-space-3 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-surface-variant flex items-center justify-between px-space-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 md:hidden">
            <div className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-md font-bold">T</div>
            <span className="font-semibold text-primary">Triid</span>
          </div>
          <div className="hidden md:block" />{/* Spacer */}
          
          <div className="flex items-center gap-space-4">
            <button onClick={() => navigate('/artisan/notifications')} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/artisan/settings')}
              className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20"
            >
              <UserAvatar name={user?.email || 'Artisan'} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="w-full h-full bg-[#1b4f63] text-white flex items-center justify-center text-xs font-bold uppercase">
      {name.charAt(0)}
    </div>
  );
}
