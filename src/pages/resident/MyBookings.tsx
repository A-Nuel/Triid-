import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
  Bell, HelpCircle, Home, Search as SearchIcon, Briefcase, User as UserIcon, Plus, Calendar, MapPin
} from "lucide-react";

export function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("jobs")
          .select(`
            id, category, description, status, scheduled_for, created_at, mode,
            artisan:users!jobs_artisan_id_fkey(full_name, artisan_profiles(cover_photo_url))
          `)
          .eq("resident_id", user.id)
          .order("created_at", { ascending: false });
        
        if (data) setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [user]);

  const upcomingJobs = jobs.filter(j => ['pending', 'scheduled', 'matched', 'en-route', 'in-progress'].includes(j.status));
  const pastJobs = jobs.filter(j => ['completed', 'cancelled', 'disputed'].includes(j.status));

  const displayedJobs = activeTab === 'upcoming' ? upcomingJobs : pastJobs;

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#f0f4f8] border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Triid</h1>
          <p className="text-xs text-gray-500">Resident Portal</p>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-2 mt-4">
          <button onClick={() => navigate('/resident/dashboard')} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white rounded-xl transition-colors font-medium">
            <Home className="w-5 h-5" /> Home
          </button>
          <button onClick={() => navigate('/resident/directory')} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white rounded-xl transition-colors font-medium">
            <SearchIcon className="w-5 h-5" /> Explore
          </button>
          <button className="flex items-center gap-3 px-4 py-3 bg-white text-gray-900 shadow-sm rounded-xl font-bold">
            <Briefcase className="w-5 h-5" /> My Jobs
          </button>
          <button onClick={() => navigate('/resident/settings/profile')} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white rounded-xl transition-colors font-medium">
            <UserIcon className="w-5 h-5" /> Profile
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={() => navigate('/resident/settings')} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white rounded-xl transition-colors font-medium w-full text-left">
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 flex justify-between items-center z-10 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-700"><Bell className="w-5 h-5" /></button>
            <button className="text-gray-500 hover:text-gray-700"><HelpCircle className="w-5 h-5" /></button>
            <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          <div className="max-w-4xl mx-auto">
            
            {/* Tabs */}
            <div className="inline-flex bg-[#e8eef3] p-1 rounded-xl mb-8">
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Upcoming
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'past' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Past
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full"></div></div>
              ) : displayedJobs.length > 0 ? (
                displayedJobs.map(job => (
                  <div key={job.id} onClick={() => navigate(`/resident/dispatch/${job.id}`)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-5 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-xl font-bold text-gray-400">
                      {job.artisan?.artisan_profiles?.cover_photo_url ? (
                        <img src={job.artisan.artisan_profiles.cover_photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        job.artisan?.full_name?.charAt(0) || "T"
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                          job.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                          job.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {job.status === 'pending' ? 'PENDING CONFIRMATION' : job.status}
                        </span>
                        <span className="text-xs text-gray-400">Job #TRD-{job.id.slice(0,4)}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1 capitalize">
                        {job.category} {job.artisan ? `with ${job.artisan.full_name}` : ''}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" /> 
                          {job.scheduled_for ? new Date(job.scheduled_for).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'As soon as possible'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> Grace Estate
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <button onClick={(e) => { e.stopPropagation(); navigate('/resident/messages'); }} className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                        Message
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); /* Reschedule or cancel logic */ }} className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                        {job.status === 'pending' ? 'Cancel' : 'Reschedule'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900">No bookings found</h3>
                  <p className="text-gray-500 mt-1">You don't have any {activeTab} bookings at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAB */}
        <button 
          onClick={() => navigate('/resident/directory')}
          className="absolute bottom-8 right-8 bg-white border border-gray-200 text-gray-900 shadow-xl px-6 py-3.5 rounded-full font-bold flex items-center gap-2 hover:bg-gray-50 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 text-gray-500" /> Book New Service
        </button>
      </main>
    </div>
  );
}
