import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Zap, Droplet, Cog, Car, ShieldAlert, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ResidentDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const categories = [
    { id: 'electrical', icon: <Zap className="w-6 h-6" />, name: 'Electrical' },
    { id: 'plumbing', icon: <Droplet className="w-6 h-6" />, name: 'Plumbing' },
    { id: 'generator', icon: <Cog className="w-6 h-6" />, name: 'Generator' },
    { id: 'vehicle', icon: <Car className="w-6 h-6" />, name: 'Vehicle' },
  ];

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-surface-variant px-space-6 py-space-4 flex justify-between items-center sticky top-0 z-10 block">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
            T
          </div>
          <span className="font-bold text-primary">Resident Portal</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Sign Out</span>
        </button>
      </header>

      <main className="flex-1 p-space-6 md:p-space-12 max-w-5xl mx-auto w-full flex flex-col gap-space-8">
        
        {/* Urgent Dispatch Section */}
        <section>
          <div className="bg-critical-bg border border-critical/20 rounded-xl p-space-6 md:p-space-8 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 bg-critical-container/30 rounded-full flex items-center justify-center mb-space-4">
              <ShieldAlert className="w-8 h-8 text-critical" />
            </div>
            <h2 className="text-2xl font-bold text-critical mb-space-2">Emergency Dispatch</h2>
            <p className="text-sm text-critical/80 mb-space-6 max-w-md">
              Tap here to instantly broadcast a distress ping to vetted artisans near you. AI will triage and match you in under 30 minutes.
            </p>
            <button 
              onClick={() => navigate('/resident/emergency')}
              className="w-full md:w-auto bg-critical text-white px-space-10 py-4 rounded-md font-bold text-lg hover:bg-[#b3261e] transition-all shadow-md shadow-critical/20 active:scale-95"
            >
              Request Urgent Help
            </button>
          </div>
        </section>

        {/* Browse & Book */}
        <section>
          <div className="flex justify-between items-end mb-space-4">
            <div>
              <h3 className="text-xl font-bold text-primary tracking-tight">Browse & Book</h3>
              <p className="text-sm text-on-surface-variant mt-1">Schedule pre-planned maintenance</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-4">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => navigate(`/resident/directory?category=${cat.id}`)}
                className="bg-white border text-left border-surface-variant rounded-xl p-space-6 flex flex-col hover:border-primary hover:shadow-sm transition-all group"
              >
                <div className="text-[#2f6b80] mb-space-4 group-hover:text-primary transition-colors">
                  {cat.icon}
                </div>
                <span className="font-semibold text-on-surface">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="flex-1 pb-16">
          <h3 className="text-xl font-bold text-primary tracking-tight mb-space-4">Recent Activity</h3>
          <div className="bg-white border border-surface-variant rounded-xl flex flex-col items-center justify-center py-space-16 text-center shadow-sm">
            <History className="w-12 h-12 text-outline-variant mb-space-4" />
            <p className="text-on-surface font-medium mb-1">No recent jobs</p>
            <p className="text-sm text-on-surface-variant">Your completed and pending jobs will appear here.</p>
          </div>
        </section>

      </main>
    </div>
  );
}
