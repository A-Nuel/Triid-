import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, Bell, HelpCircle, Phone, MessageSquare, Navigation, CheckCircle, Clock, MapPin, AlertCircle, User as UserIcon, Briefcase
} from "lucide-react";

export function ResidentDispatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!job || (job.status !== 'in-progress' && job.status !== 'en-route')) {
      return;
    }
    const startTime = new Date(job.updated_at || job.created_at || Date.now()).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsed(diff > 0 ? diff : 0);
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [job?.status, job?.updated_at, job?.created_at]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!id || !user) return;
    
    async function fetchJob() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            artisan:users!jobs_artisan_id_fkey(full_name, phone, artisan_profiles(average_rating, cover_photo_url))
          `)
          .eq('id', id)
          .single();
          
        if (data) setJob(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();

    const channel = supabase
      .channel(`public:jobs:id=eq.${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${id}` },
        (payload) => {
          setJob((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!job) return <div className="min-h-screen flex items-center justify-center">Job not found</div>;

  const cancelJob = async () => {
    if (!window.confirm("Are you sure you want to cancel this job?")) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/v1/jobs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        navigate('/resident/dashboard');
      } else {
        const err = await res.json();
        alert(err.error?.message || "Failed to cancel job");
      }
    } catch(err) {
      console.error(err);
      alert("Failed to cancel job");
    }
  };

  const renderEnRoute = () => (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-[#f0f4f8] rounded-2xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#1b4f63] rounded-full flex items-center justify-center text-white shrink-0">
          <Navigation className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Artisan is en route</h2>
          <p className="text-gray-500">Elapsed time: {formatTime(elapsed)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <p className="text-xs font-bold text-gray-400 tracking-wider mb-4 uppercase">Artisan Contact</p>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden shrink-0 font-bold text-xl flex items-center justify-center text-gray-500">
              {job.artisan?.artisan_profiles?.cover_photo_url ? (
                <img src={job.artisan.artisan_profiles.cover_photo_url} alt="" className="w-full h-full object-cover" />
              ) : job.artisan?.full_name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{job.artisan?.full_name || 'Assigned Artisan'}</h3>
              <p className="text-sm text-gray-500 capitalize">{job.category} - TRD-{job.id.slice(0,4)}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-auto">
            <a href={`tel:${job.artisan?.phone}`} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
              <Phone className="w-5 h-5" /> Call
            </a>
            <button onClick={() => navigate('/resident/messages')} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
              <MessageSquare className="w-5 h-5" /> Message
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <p className="text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Destination</p>
          <h3 className="text-lg font-bold text-gray-900">Your Location</h3>
          <p className="text-sm text-gray-500 mb-4">Grace Estate</p>
          <div className="flex-1 bg-gray-100 rounded-xl relative overflow-hidden min-h-[150px]">
            {/* Map Placeholder */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-50 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b4f63]/80 to-transparent"></div>
            <button className="absolute bottom-4 right-4 bg-white p-3 rounded-xl shadow-lg text-[#1b4f63]">
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInProgress = () => (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-white border-l-4 border-blue-500 rounded-r-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm border-t border-b border-r border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">In Progress</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 capitalize">TRD-{job.id.slice(0,4)}</h2>
          <p className="text-gray-500 capitalize">{job.category} - {job.description}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 text-center">
          <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Elapsed Time</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{formatTime(elapsed)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 tracking-wider mb-6 flex items-center gap-2 uppercase">
            <UserIcon className="w-4 h-4" /> Artisan Details
          </p>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
              {job.artisan?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{job.artisan?.full_name}</h3>
              <p className="text-sm text-gray-500">Verified Artisan</p>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-gray-100">
             <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{job.artisan?.phone || 'No phone'}</span>
             </div>
             <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">On-site at Grace Estate</span>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 tracking-wider mb-4 flex items-center gap-2 uppercase">
            <AlertCircle className="w-4 h-4" /> Job Information
          </p>
          <p className="text-gray-700 leading-relaxed text-sm mb-6">
            {job.description || "No detailed description provided."}
          </p>
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm border border-orange-100">
            <strong>Note:</strong> Payment is securely held in escrow and will only be released when you confirm completion.
          </div>
        </div>
      </div>
      
      <div className="text-center mt-4 flex flex-col items-center gap-3">
        <button onClick={cancelJob} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg transition-colors">
          Cancel Job
        </button>
        <button className="text-sm font-bold text-gray-500 hover:text-gray-700">Need to report an issue? Contact Support</button>
      </div>
    </div>
  );

  const renderCompleted = () => (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 border border-gray-100 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
        <div className="p-8 md:p-12 flex flex-col items-center text-center">
          <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2 border border-orange-100">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            Waiting for Confirmation
          </div>
          <p className="text-gray-600 font-medium mb-2">Job Complete. Total Payout Scheduled:</p>
          <h2 className="text-5xl md:text-6xl font-bold text-[#0f2c38] mb-10">₦{job.estimated_amount?.toLocaleString() || '15,000'}</h2>
          
          <div className="bg-[#f0f6fa] rounded-xl p-5 border border-[#d6e4ef] w-full max-w-lg mb-8">
            <div className="flex items-start gap-3 mb-4 text-left">
              <AlertCircle className="w-5 h-5 text-[#1b4f63] shrink-0 mt-0.5" />
              <p className="text-[#3c5a6b] text-sm leading-relaxed">
                Payment releases once you confirm the job is satisfactory, or automatically after 48 hours.
              </p>
            </div>
            <div className="bg-white border border-[#d6e4ef] rounded-lg px-4 py-3 flex justify-between items-center text-sm font-medium">
              <span className="text-gray-600">Auto-release in:</span>
              <span className="text-orange-600 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> 47:59:56
              </span>
            </div>
          </div>

          <button 
            onClick={() => navigate(`/resident/jobs/${job.id}/confirm`)}
            className="w-full max-w-lg bg-[#1b4f63] hover:bg-[#123644] text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <CheckCircle className="w-6 h-6" /> Confirm & Release Payment
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 mb-3 text-lg">Job Summary</h3>
        <div className="bg-[#f0f4f8] rounded-xl p-5 border border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#e0eaf3] text-[#1b4f63] rounded-lg flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 capitalize">{job.category} - {job.description || 'Service Call'}</h4>
              <p className="text-sm text-gray-500">TRD-{job.id.slice(0,4)} • Artisan: {job.artisan?.full_name}</p>
            </div>
          </div>
          <button className="text-sm font-bold text-[#1b4f63] hover:underline">View Details</button>
        </div>
      </div>
      
      <div className="text-center mt-4 pb-10">
        <button className="text-sm font-bold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 mx-auto">
          <HelpCircle className="w-4 h-4" /> Issue with confirmation? Contact Support
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/resident/dashboard')} className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Job Details</h1>
        </div>
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

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {job.status === 'en-route' && renderEnRoute()}
        {(job.status === 'in-progress' || job.status === 'matched' || job.status === 'pending') && renderInProgress()}
        {job.status === 'completed' && renderCompleted()}
      </main>
    </div>
  );
}

