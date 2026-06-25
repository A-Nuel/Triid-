import { useState, useEffect } from 'react';
import { Briefcase, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'all' | 'completed' | 'cancelled' | 'disputed';

export function JobHistory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    if (!user) return;
    setLoading(true);
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

  useEffect(() => {
    loadHistory();
  }, [user]);

  const filteredJobs = jobs.filter(j => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return j.status === 'completed' || j.status === 'confirmed';
    if (activeTab === 'cancelled') return j.status === 'cancelled';
    if (activeTab === 'disputed') return j.status === 'disputed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 w-full font-sans min-h-screen bg-slate-50/50">
      {/* Header section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#113a4a] mb-2 tracking-tight">Job History</h1>
        <p className="text-[#475569] text-sm font-medium">
          Review your completed, cancelled, and disputed service requests.
        </p>
      </div>

      {/* Tabs / Filter Pills */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {(['all', 'completed', 'cancelled', 'disputed'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-xs font-bold rounded-full capitalize transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#113a4a] text-white shadow-sm'
                  : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          );
        })}
        
        {/* Refresh button */}
        <button
          onClick={loadHistory}
          disabled={loading}
          className="ml-auto p-2 text-gray-500 hover:text-[#113a4a] hover:bg-white rounded-full border border-gray-200 shadow-sm bg-white transition-all cursor-pointer"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-[#113a4a] rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading your job history...</p>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const isCompleted = job.status === 'completed' || job.status === 'confirmed';
            const isCancelled = job.status === 'cancelled';
            const isDisputed = job.status === 'disputed';

            // Left colored bar
            let borderLeftClass = 'border-l-[4px] border-l-sky-500';
            if (isCompleted) borderLeftClass = 'border-l-[4px] border-l-emerald-600';
            else if (isDisputed) borderLeftClass = 'border-l-[4px] border-l-amber-500';
            else if (isCancelled) borderLeftClass = 'border-l-[4px] border-l-slate-400';

            // Status label and colors
            let statusBadge = 'bg-sky-50 text-sky-700 border border-sky-200';
            let statusText = job.status || 'ACTIVE';
            if (isCompleted) {
              statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
              statusText = 'COMPLETED';
            } else if (isDisputed) {
              statusBadge = 'bg-amber-50 text-amber-700 border border-amber-200';
              statusText = 'DISPUTED';
            } else if (isCancelled) {
              statusBadge = 'bg-slate-50 text-slate-700 border border-slate-200';
              statusText = 'CANCELLED';
            }

            return (
              <div
                key={job.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200/80 ${borderLeftClass} flex flex-col justify-between overflow-hidden relative p-6 transition-all hover:shadow-md h-full`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] text-gray-400 font-mono font-semibold tracking-wider">
                      REQ-{job.id.slice(-4).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md tracking-wider uppercase ${statusBadge}`}>
                      {statusText}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-2 capitalize leading-snug">
                    {job.category || 'Maintenance Work'}
                  </h3>
                  
                  <p className="text-xs text-gray-600 leading-relaxed mb-6 line-clamp-3 min-h-[48px]">
                    {job.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <div className="border-t border-gray-100 my-4" />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#113a4a]/10 flex items-center justify-center text-[#113a4a] text-xs font-bold uppercase overflow-hidden border border-gray-100 flex-shrink-0">
                        {job.resident?.full_name?.charAt(0) || 'R'}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {job.resident?.full_name || 'Resident Client'}
                      </span>
                    </div>

                    <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">
                      {new Date(job.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Blank Space / Empty State Design */
        <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm flex flex-col items-center justify-center my-12">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No requests found</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            There are currently no {activeTab === 'all' ? '' : activeTab} service requests registered in your history.
          </p>
        </div>
      )}
    </div>
  );
}
