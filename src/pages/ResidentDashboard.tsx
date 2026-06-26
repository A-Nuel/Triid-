import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ShieldAlert, Calendar, History, 
  Settings, HelpCircle, MapPin, Star,
  Zap, Droplet, Cog, Car, Wrench, Navigation2, Search, MoreHorizontal, CheckCircle2, ChevronLeft, ChevronRight, Menu,
  LayoutDashboard, Store, MessageSquare, BarChart2, Briefcase, Map, User, Home, AlertOctagon, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

function getElapsedTime(startStr: string, now: Date) {
  if (!startStr) return '00:00:00';
  const start = new Date(startStr);
  const diffMs = Math.max(0, now.getTime() - start.getTime());
  const h = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
  const m = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
  const s = Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function ResidentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [trustedArtisans, setTrustedArtisans] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // Fetch jobs
        const res = await fetch('/api/v1/jobs', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const { data } = await res.json();
          setJobs(data || []);
        }

        // Fetch artisans
        const { data: artisansData, error: artisansErr } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            artisan_profiles (
              skill_categories,
              average_rating,
              total_jobs_completed,
              verification_status
            )
          `)
          .eq('role', 'artisan')
          .limit(5);
        
        if (!artisansErr && artisansData) {
          setTrustedArtisans(artisansData);
        }

        // Fetch user's name from database if user_metadata is incomplete
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (userData?.full_name) {
          setUserName(userData.full_name.split(' ')[0]);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'matched' || j.status === 'en-route' || j.status === 'in-progress');

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row font-sans text-on-surface">
      
      {/* Top Navbar (Mobile Only) */}
      <nav className="bg-surface border-b border-surface-variant sticky top-0 z-50 flex justify-between items-center px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center font-bold text-sm">
            T
          </div>
          <span className="font-bold text-primary text-lg">Triid</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/resident/emergency')}
            className="bg-critical text-on-error text-xs font-bold px-3 py-1.5 rounded"
          >
            EMERGENCY
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="w-6 h-6 text-primary" />
          </button>
        </div>
      </nav>

      {/* Side Navbar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#1d2630] flex-col p-4 z-40 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:flex`}>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-white/10 text-white rounded-md flex items-center justify-center font-bold text-xl">
            T
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">Dispatch Hub</h1>
            <p className="text-white/70 text-xs">Role: Resident</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/resident/emergency')}
          className="w-full bg-critical text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 mb-6 shadow-sm hover:opacity-90 font-semibold text-sm transition-opacity"
        >
          <ShieldAlert className="w-4 h-4" />
          Report Incident
        </button>

        <nav className="flex-1 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2 bg-[#003849] text-[#76a2b6] font-semibold rounded-lg w-full text-left">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button onClick={() => navigate('/resident/directory')} className="flex items-center gap-3 px-3 py-2 text-[#4d6879] hover:bg-white/5 rounded-lg transition-all w-full text-left">
            <Store className="w-5 h-5" />
            <span className="text-sm font-medium">Service Marketplace</span>
          </button>
          <button onClick={() => navigate('/resident/bookings')} className="flex items-center gap-3 px-3 py-2 text-[#4d6879] hover:bg-white/5 rounded-lg transition-all w-full text-left">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium">Active Dispatches</span>
          </button>
          <button onClick={() => navigate('/resident/messages')} className="flex items-center gap-3 px-3 py-2 text-[#4d6879] hover:bg-white/5 rounded-lg transition-all w-full text-left">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Messaging</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2 text-[#4d6879] hover:bg-white/5 rounded-lg transition-all w-full text-left">
            <BarChart2 className="w-5 h-5" />
            <span className="text-sm font-medium">Analytics</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-white/10">
          <button onClick={() => navigate('/resident/settings')} className="flex items-center gap-3 px-3 py-2 text-[#4d6879] hover:bg-white/5 rounded-lg transition-all w-full text-left">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2 text-[#4d6879] hover:bg-white/5 rounded-lg transition-all w-full text-left">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Help Center</span>
          </button>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2 text-[#4d6879] hover:text-critical hover:bg-critical/10 rounded-lg transition-all w-full text-left mt-2">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:ml-64 min-h-screen pb-20 md:pb-0">
        
        {/* Header Zone */}
        <header className="bg-primary text-white relative z-20 md:sticky md:top-0 md:z-30 px-6 py-6 shadow-md border-b border-[#003849]">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{getGreeting()}, {userName || user?.user_metadata?.full_name?.split(' ')[0] || 'Resident'}</h2>
              <p className="text-white/80 mt-1 flex items-center gap-1 text-sm">
                <MapPin className="w-4 h-4" />
                Redemption City - Grace Estate
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button 
                onClick={() => navigate('/resident/emergency')}
                className="flex items-center justify-center gap-2 bg-critical text-white font-semibold py-3 px-6 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                <AlertOctagon className="w-5 h-5" />
                Emergency Alert
              </button>
              <button 
                onClick={() => navigate('/resident/directory')}
                className="flex items-center justify-center gap-2 bg-white text-primary font-semibold py-3 px-6 rounded-lg shadow-sm hover:bg-surface-container-low transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Schedule a service
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            
            {/* Active Jobs */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl font-bold text-on-surface">Active Jobs</h3>
                <button className="text-sm font-medium text-primary hover:underline">View all</button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : activeJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeJobs.map(job => (
                    <div key={job.id} onClick={() => navigate(`/resident/dispatch/${job.id}`)} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${job.status === 'in-progress' ? 'border-warning' : 'border-success'} flex flex-col gap-3 group hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${job.status === 'in-progress' ? 'bg-warning animate-pulse' : 'bg-success'}`}></span>
                            <span className={`text-[10px] font-bold tracking-wider uppercase ${job.status === 'in-progress' ? 'text-warning' : 'text-success'}`}>
                              {job.status === 'in-progress' ? 'In Progress' : 'Arriving Soon'}
                            </span>
                          </div>
                          <h4 className="font-semibold text-on-surface text-base capitalize">{job.category}</h4>
                          <p className="text-xs font-mono text-on-surface-variant mt-1 uppercase">TRD-{job.id.slice(0,8)}</p>
                        </div>
                        <div className={`${job.status === 'in-progress' ? 'bg-warning-bg text-warning' : 'bg-success-bg text-success'} p-2 rounded-lg`}>
                          {job.category === 'electrical' ? <Zap className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2 pt-3 border-t border-surface-variant/30">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary">
                          {job.artisan_id ? 'A' : '?'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-on-surface">Artisan Assigned</p>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> 4.9 (120 reviews)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{job.status === 'in-progress' ? 'Elapsed Time' : 'ETA'}</p>
                          <p className={`text-sm font-semibold ${job.status === 'in-progress' ? 'font-mono' : ''} text-on-surface`}>
                            {job.status === 'in-progress' ? getElapsedTime(job.created_at, now) : '15 mins'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-surface-variant/50 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-primary/40 mb-4">
                    <History className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-on-surface mb-1">No Active Jobs</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm">You don't have any ongoing service requests at the moment. Schedule a new service to get started.</p>
                </div>
              )}
            </section>

            {/* Browse Services */}
            <section>
              <h3 className="text-xl font-bold text-on-surface mb-4">Browse Services</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'plumbing', icon: <Droplet className="w-8 h-8" />, name: 'Plumbing', artisans: 42, color: 'text-[#1b4f63]', bg: 'bg-[#e1f0fc]' },
                  { id: 'electrical', icon: <Zap className="w-8 h-8" />, name: 'Electrical', artisans: 38, color: 'text-warning', bg: 'bg-warning-bg' },
                  { id: 'cleaning', icon: <Sparkles className="w-8 h-8" />, name: 'Cleaning', artisans: 55, color: 'text-success', bg: 'bg-success-bg' },
                  { id: 'generator', icon: <Cog className="w-8 h-8" />, name: 'Generator', artisans: 18, color: 'text-primary', bg: 'bg-primary-fixed' },
                ].map(service => (
                  <button 
                    key={service.id}
                    onClick={() => navigate(`/resident/directory?category=${service.id}`)}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md hover:bg-surface-bright transition-all flex flex-col items-center text-center gap-2 border border-surface-variant/50"
                  >
                    <div className={`w-16 h-16 rounded-full ${service.bg} flex items-center justify-center ${service.color} mb-2`}>
                      {service.icon}
                    </div>
                    <h4 className="font-semibold text-sm text-on-surface">{service.name}</h4>
                    <p className="text-[10px] font-medium text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full">{service.artisans} Artisans</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Trusted Near You */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Trusted Near You</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Highly rated artisans currently in Redemption City</p>
                </div>
                {trustedArtisans.length > 0 && (
                  <div className="hidden sm:flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              
              {trustedArtisans.length > 0 ? (
                <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 hide-scroll snap-x">
                  {trustedArtisans.map((artisan, idx) => {
                    const isVouched = artisan.artisan_profiles?.verification_status === 'verified';
                    const tag = isVouched ? 'VOUCHED' : 'TRUSTED';
                    const tagColor = isVouched ? 'bg-success-bg text-success' : 'bg-[#c7e4f8] text-[#4b6677]';
                    
                    return (
                      <div key={idx} className="min-w-[280px] w-[280px] bg-white rounded-xl p-4 shadow-sm border border-surface-variant/30 flex flex-col gap-3 snap-start relative">
                        <div className={`absolute top-4 right-4 flex items-center gap-1 ${tagColor} px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                          <CheckCircle2 className="w-3 h-3" /> {tag}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-surface-container ring-2 ring-surface-variant flex items-center justify-center text-primary text-xl font-bold uppercase">
                            {artisan.full_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-on-surface">{artisan.full_name}</h4>
                            <p className="text-xs text-on-surface-variant capitalize">{artisan.artisan_profiles?.skill_categories?.[0] || 'General'}</p>
                            <div className="flex items-center gap-1 mt-1 text-warning">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs font-semibold text-on-surface">{artisan.artisan_profiles?.average_rating || 'New'}</span>
                              <span className="text-[10px] text-on-surface-variant">({artisan.artisan_profiles?.total_jobs_completed || 0})</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-2 flex-1">
                          Available for services in your area. Contact for a quote.
                        </p>
                        <button 
                          onClick={() => navigate('/resident/messages', { state: { prefillMessage: `Hi, I would like to request a quote for your services.`, artisanId: artisan.id, artisanName: artisan.full_name } })}
                          className="mt-2 w-full bg-[#1b4f63] text-white font-semibold text-sm py-2 rounded-lg hover:bg-[#003849] transition-colors"
                        >
                          Request Quote
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-surface-variant/50 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-primary/40 mb-4">
                    <Search className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-on-surface mb-1">No Trusted Artisans Found</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm">We are currently verifying artisans in your area. Check back later.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Navbar */}
      <nav className="fixed bottom-0 w-full md:hidden z-50 bg-white border-t border-surface-variant shadow-lg flex justify-around items-center h-16 pb-safe">
        <button className="flex flex-col items-center justify-center bg-[#003849] text-[#76a2b6] rounded-xl py-1 px-4">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </button>
        <button onClick={() => navigate('/resident/directory')} className="flex flex-col items-center justify-center text-[#41484c] px-4 py-1 rounded-xl">
          <Store className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Browse</span>
        </button>
        <button onClick={() => navigate('/resident/messages')} className="flex flex-col items-center justify-center text-[#41484c] px-4 py-1 rounded-xl">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Inbox</span>
        </button>
        <button className="flex flex-col items-center justify-center text-[#41484c] px-4 py-1 rounded-xl">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </nav>
      
      {/* Hide scrollbar global class for horizontal scrolling */}
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

