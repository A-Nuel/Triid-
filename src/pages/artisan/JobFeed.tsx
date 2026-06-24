import { useState, useEffect } from 'react';
import { UserCheck, Zap, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Assuming supabase client exists for auth session

export function JobFeed() {
  const [activeTab, setActiveTab] = useState<'incoming'|'scheduled'>('incoming');
  const [isAvailable, setIsAvailable] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadJobs() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/v1/jobs', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const { data } = await res.json();
          setJobs(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'matched');

  return (
    <div className="max-w-5xl mx-auto p-space-6 md:p-space-8 w-full">
      {/* Banner */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-space-6 mb-space-8 flex flex-col md:flex-row gap-space-6 items-start">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <UserCheck className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-primary mb-1">Complete your profile</h2>
          <p className="text-sm text-on-surface-variant mb-space-4">
            Adding your trade certifications and verifying your ID increases your visibility to high-priority emergency dispatches by up to 40%.
          </p>
          <div className="w-full max-w-sm h-2 bg-surface-variant rounded-full overflow-hidden mb-2">
            <div className="h-full bg-[#1b4f63] w-[60%]" />
          </div>
          <p className="text-xs text-on-surface-variant mb-space-2 font-medium">60% Complete</p>
          <button className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
            Update Profile Now <ArrowRight className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-space-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1 tracking-tight">Job Feed</h1>
          <p className="text-on-surface-variant text-sm">Review your incoming and upcoming requests.</p>
        </div>
        <button 
          onClick={() => setIsAvailable(!isAvailable)}
          className={`flex items-center gap-2 px-space-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            isAvailable 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-surface-variant/50 border-outline-variant text-on-surface-variant'
          }`}
        >
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isAvailable ? 'bg-green-600' : 'bg-outline'} relative`}>
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          Available for jobs
        </button>
      </div>

      {/* Active Job Banner */}
      {jobs.filter(j => j.status === 'accepted' || j.status === 'in_progress').map(job => (
        <div key={job.id} onClick={() => navigate(job.status === 'in_progress' ? `/artisan/in-progress/${job.id}` : `/artisan/en-route/${job.id}`)} className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 cursor-pointer hover:bg-blue-100 transition flex items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-900">Active {job.mode === 'emergency' ? 'Emergency' : 'Job'}</h3>
            <p className="text-sm text-blue-700">{job.description}</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">
            {job.status === 'in_progress' ? 'Resume Work' : 'Go to Map'}
          </button>
        </div>
      ))}

      {/* Tabs */}
      <div className="flex border-b border-surface-variant mb-space-6">
        <button 
          onClick={() => setActiveTab('incoming')}
          className={`px-space-4 py-space-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'incoming' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Incoming <span className="bg-surface-variant text-on-surface-variant text-xs px-2 py-0.5 rounded-full">3</span>
        </button>
        <button 
          onClick={() => setActiveTab('scheduled')}
          className={`px-space-4 py-space-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'scheduled' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Scheduled
        </button>
      </div>

      {/* Content */}
      <div className="space-y-space-4">
        {loading ? (
             <div className="text-center py-space-12 text-on-surface-variant flex flex-col items-center">
               <div className="w-8 h-8 rounded-full border-4 border-surface-variant border-t-primary animate-spin mb-4" />
               <p className="font-medium">Loading jobs...</p>
             </div>
        ) : activeTab === 'incoming' ? (
          pendingJobs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-4">
              {pendingJobs.map((job) => (
                <div key={job.id} className="bg-white border text-left border-surface-variant rounded-xl flex flex-col relative overflow-hidden shadow-sm">
                  <div className={`absolute top-0 left-0 w-1 h-full ${job.mode === 'emergency' ? 'bg-critical' : 'bg-[#1b4f63]'}`} />
                  <div className="p-space-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-space-4">
                      {job.mode === 'emergency' ? (
                          <span className="bg-critical-bg text-critical text-xs font-bold px-2 py-1 flex items-center gap-1 rounded-sm tracking-widest uppercase">
                            <span className="w-1.5 h-1.5 bg-critical rounded-full animate-pulse" /> Emergency
                          </span>
                      ) : (
                          <span className="bg-surface-variant text-on-surface text-xs font-bold px-2 py-1 flex items-center gap-1 rounded-sm tracking-widest uppercase">
                            Standard
                          </span>
                      )}
                      
                      <span className="text-xs font-mono text-on-surface-variant">
                         {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-primary mb-2 capitalize">{job.description.substring(0, 40)}{job.description.length > 40 ? '...' : ''}</h3>
                    <div className="space-y-1 mb-space-4">
                      <p className="text-sm flex items-center gap-2 text-on-surface">
                        <span className="text-on-surface-variant">📍</span> {job.location?.coordinates ? `[Location Data]` : 'Location pending'}
                      </p>
                      <p className="text-sm flex items-center gap-2 text-on-surface">
                        <span className="text-on-surface-variant">🏷️</span> <span className="capitalize">{job.category}</span>
                      </p>
                    </div>
                    
                    <p className="text-sm text-on-surface-variant mb-space-6 flex-1">
                      {job.description}
                    </p>
                    
                    <div className="flex gap-space-3 mt-auto">
                      {job.mode === 'emergency' ? (
                          <button 
                            onClick={() => navigate(`/artisan/emergency/${job.id}`)}
                            className="flex-1 bg-critical text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-[#b3261e] shadow-sm"
                          >
                            Accept Dispatch
                          </button>
                      ) : (
                          <button 
                            onClick={() => navigate(`/artisan/requests/${job.id}`)}
                            className="w-full bg-[#1b4f63] text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-[#153e4d] shadow-sm"
                          >
                            Review Request
                          </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-space-12 text-on-surface-variant flex flex-col items-center">
              <Clock className="w-12 h-12 mb-space-4 text-outline-variant" />
              <p className="font-medium text-on-surface mb-1">No incoming jobs</p>
              <p className="text-sm">You are currently looking for jobs. Incoming requests will appear here.</p>
            </div>
          )
        ) : activeTab === 'scheduled' ? (
          jobs.filter(j => j.mode === 'scheduled' && (j.status === 'accepted' || j.status === 'confirmed')).length > 0 ? (
            <div className="grid grid-cols-1 gap-space-4">
              {jobs.filter(j => j.mode === 'scheduled' && (j.status === 'accepted' || j.status === 'confirmed')).map((job) => (
                <div key={job.id} className="bg-white border text-left border-surface-variant rounded-xl flex flex-col p-space-6 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-surface-variant text-on-surface text-xs font-bold px-2 py-1 flex items-center rounded-sm tracking-widest uppercase">
                      Scheduled
                    </span>
                    <span className="text-xs font-mono text-on-surface-variant">
                       {new Date(job.scheduled_for || job.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2 capitalize">{job.description}</h3>
                  <div className="flex gap-space-3 mt-4">
                    <button 
                      onClick={() => navigate(`/artisan/in-progress/${job.id}`)}
                      className="flex-1 bg-primary text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-primary/90 shadow-sm"
                    >
                      Start Work
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-space-12 text-on-surface-variant flex flex-col items-center">
              <Clock className="w-12 h-12 mb-space-4 text-outline-variant" />
              <p className="font-medium text-on-surface mb-1">No scheduled jobs</p>
              <p className="text-sm">Your upcoming booked jobs will appear here.</p>
            </div>
          )
        ) : null}
      </div>

    </div>
  );
}
