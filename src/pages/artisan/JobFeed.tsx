import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  AlertTriangle, 
  UserCircle,
  ImagePlus,
  Star,
  Banknote,
  PieChart,
  Zap,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function JobFeed() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'emergency'|'standard'>('emergency');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!session) return;
      try {
        const [jobsRes, dashRes] = await Promise.all([
          fetch('/api/v1/jobs', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('/api/v1/artisan/dashboard', { headers: { Authorization: `Bearer ${session.access_token}` } })
        ]);
        
        if (jobsRes.ok) {
          const { data } = await jobsRes.json();
          setJobs(data || []);
        }
        if (dashRes.ok) {
          const data = await dashRes.json();
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  const toggleEmergency = async () => {
    if (!dashboardData?.profile) return;
    const current = dashboardData.profile.accepts_emergency;
    
    // Optimistic update
    setDashboardData({
      ...dashboardData,
      profile: {
        ...dashboardData.profile,
        accepts_emergency: !current
      }
    });

    try {
      await fetch('/api/v1/artisan/availability', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ accepts_emergency: !current })
      });
    } catch (err) {
      console.error(err);
      // Revert on error
      setDashboardData({
        ...dashboardData,
        profile: { ...dashboardData.profile, accepts_emergency: current }
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
  }

  const user = dashboardData?.user;
  const profile = dashboardData?.profile;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || "Artisan";

  const emergencyJobs = jobs.filter(j => j.mode === 'emergency');
  const standardJobs = jobs.filter(j => j.mode === 'scheduled');

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#001f29] tracking-tight">
          Good morning, {firstName}.
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Here's your performance snapshot for today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Earnings */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Today's Earnings</div>
            <div className="text-2xl font-bold text-gray-900">₦ {profile?.todays_earnings?.toLocaleString() || "0"}</div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Completion Rate</div>
            <div className="text-2xl font-bold text-gray-900">{profile?.completion_rate || 0}%</div>
          </div>
        </div>

        {/* Avg Rating */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Avg Rating</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{profile?.average_rating || "0.0"}</span>
              <span className="text-sm font-medium text-gray-500">({profile?.total_jobs_completed || 0} jobs)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Emergency Toggle Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Emergency Dispatch</h3>
                <p className="text-sm text-gray-500 hidden sm:block">Available for urgent {profile?.skill_categories?.[0]?.toLowerCase() || "services"} jobs</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${profile?.accepts_emergency ? 'text-green-600' : 'text-gray-400'}`}>
                {profile?.accepts_emergency ? 'Active' : 'Inactive'}
              </span>
              <button 
                onClick={toggleEmergency}
                className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors focus:outline-none ${profile?.accepts_emergency ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                  {profile?.accepts_emergency && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
              </button>
            </div>
          </div>

          {/* Job Feed Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('emergency')}
                className={`flex-1 py-4 text-center font-bold text-sm transition-colors flex justify-center items-center gap-2 ${
                  activeTab === 'emergency' 
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50/30' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> Emergency Dispatch
              </button>
              <button 
                onClick={() => setActiveTab('standard')}
                className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${
                  activeTab === 'standard' 
                    ? 'text-[#001f29] border-b-2 border-[#001f29] bg-gray-50/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Standard Bookings
              </button>
            </div>

            {/* Job List */}
            <div className="p-4 sm:p-6 space-y-4">
              {activeTab === 'emergency' ? (
                emergencyJobs.length > 0 ? (
                  emergencyJobs.map(job => (
                    <div key={job.id} className="border-l-4 border-l-red-600 bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">{job.description}</h4>
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                            <MapPin className="w-4 h-4" /> {job.location?.coordinates ? `[Lat: ${job.location.coordinates[1]}, Lng: ${job.location.coordinates[0]}]` : 'Address pending'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white uppercase tracking-wider mb-1">
                            90s Response
                          </div>
                          <div className="font-bold text-lg text-red-600">₦ {job.estimated_amount || "15,000"}</div>
                          <div className="text-xs text-gray-500 font-medium">Est. 1h job</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-2">
                        <button 
                          onClick={() => navigate(`/artisan/emergency/${job.id}`)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors"
                        >
                          Accept Now
                        </button>
                        <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-lg transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-900">No active emergencies</p>
                    <p className="text-sm mt-1">Stay online to receive urgent requests.</p>
                  </div>
                )
              ) : (
                standardJobs.length > 0 ? (
                  standardJobs.map(job => (
                     <div key={job.id} className="border-l-4 border-l-[#003849] bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="font-bold text-lg text-gray-900">{job.description}</h4>
                           <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                             <MapPin className="w-4 h-4" /> Scheduled for {new Date(job.scheduled_for || job.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="font-bold text-lg text-[#003849]">₦ {job.estimated_amount || "Negotiable"}</div>
                         </div>
                       </div>
                       
                       <div className="flex gap-3 mt-2">
                         <button 
                           onClick={() => navigate(`/artisan/requests/${job.id}`)}
                           className="flex-1 bg-[#001f29] hover:bg-black text-white font-bold py-2.5 rounded-lg transition-colors"
                         >
                           View Details
                         </button>
                       </div>
                     </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <UserCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-900">No standard bookings</p>
                    <p className="text-sm mt-1">Check back later for new requests.</p>
                  </div>
                )
              )}

              {/* Mock missed emergency card */}
              {activeTab === 'emergency' && (
                <div className="border-l-4 border-l-gray-300 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 opacity-75">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-gray-700">Overflowing Toilet</h4>
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4" /> Block 4, 1004 Estate
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-500">₦ 12,500</div>
                      <div className="text-xs text-gray-400 font-medium">Est. 45m job</div>
                    </div>
                  </div>
                  
                  <div className="flex mt-2">
                    <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-2.5 rounded-lg cursor-not-allowed">
                      Missed (Timed Out)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Profile Completion */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">Profile Completion</h3>
                <p className="text-xs text-gray-500">Get more jobs by completing your profile</p>
              </div>
            </div>

            <div className="mt-4 mb-6">
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                <span>Progress</span>
                <span>{profile?.completion_percentage || 50}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-[#003849] h-2.5 rounded-full" style={{ width: `${profile?.completion_percentage || 50}%` }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => navigate('/artisan/settings/profile')}
                className="w-full flex items-center justify-center gap-2 bg-[#001f29] hover:bg-black text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
              >
                <ImagePlus className="w-4 h-4" /> Add Portfolio
              </button>
              <button 
                onClick={() => navigate('/artisan/settings/verification')}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-2.5 px-4 rounded-lg transition-colors"
              >
                Verify Identity {profile?.verification_status === 'pending' ? '(Pending)' : ''}
              </button>
            </div>
          </div>

          {/* Current Zone Map */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="relative h-48 bg-gray-200">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" 
                alt="Map View" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#001f29]/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <MapPin className="w-10 h-10 text-red-600 fill-red-600 drop-shadow-md" />
                  <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs font-bold text-gray-900 shadow-sm">
                Current Zone: Victoria Island
              </div>
            </div>
            <div className="p-5">
              <h4 className="font-bold text-gray-900 mb-1">High Demand Area</h4>
              <p className="text-sm text-gray-500">
                Stay in your current zone for <span className="font-bold text-gray-900">2x dispatch priority</span>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

