import { useState, useEffect } from 'react';
import { History, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function JobHistory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'completed'|'cancelled'|'disputed'>('completed');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/v1/jobs', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const { data } = await res.json();
          // The API returns all jobs. We can filter them here based on status.
          setJobs(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const filteredJobs = jobs.filter(j => 
    (activeTab === 'completed' && (j.status === 'completed' || j.status === 'confirmed')) ||
    (activeTab === 'cancelled' && j.status === 'cancelled') ||
    (activeTab === 'disputed' && j.status === 'disputed')
  );

  return (
    <div className="max-w-5xl mx-auto p-space-6 md:p-space-8 w-full font-sans">
      <div className="mb-space-8">
        <h1 className="text-3xl font-bold text-primary mb-1 tracking-tight">Job History</h1>
        <p className="text-on-surface-variant text-sm">Review your past jobs and resolutions.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-variant mb-space-6">
        <button 
          onClick={() => setActiveTab('completed')}
          className={`px-space-4 py-space-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'completed' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Completed
        </button>
        <button 
          onClick={() => setActiveTab('cancelled')}
          className={`px-space-4 py-space-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'cancelled' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Cancelled
        </button>
        <button 
          onClick={() => setActiveTab('disputed')}
          className={`px-space-4 py-space-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'disputed' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Disputed
        </button>
      </div>

      <div className="bg-white border border-surface-variant rounded-xl overflow-hidden shadow-sm">
        {loading ? (
           <div className="p-space-12 text-center text-on-surface-variant">Loading jobs...</div>
        ) : filteredJobs.length > 0 ? (
          <div className="divide-y divide-surface-variant">
            {filteredJobs.map(job => (
               <div key={job.id} className="p-space-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     {activeTab === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                     {activeTab === 'cancelled' && <XCircle className="w-4 h-4 text-red-600" />}
                     {activeTab === 'disputed' && <AlertCircle className="w-4 h-4 text-orange-600" />}
                     
                     <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        activeTab === 'completed' ? 'text-green-700 bg-green-50' : 
                        activeTab === 'cancelled' ? 'text-red-700 bg-red-50' : 'text-orange-700 bg-orange-50'
                     }`}>
                       {job.status}
                     </span>
                     <span className="text-xs text-on-surface-variant">
                       {new Date(job.created_at).toLocaleDateString()}
                     </span>
                   </div>
                   <h3 className="text-lg font-bold text-primary capitalize">{job.category} - {job.mode}</h3>
                   <p className="text-sm text-on-surface-variant line-clamp-1">{job.description}</p>
                 </div>
                 <div className="text-left sm:text-right">
                   <p className="text-xl font-bold font-mono text-primary tracking-tight">₦{job.estimated_amount || '0.00'}</p>
                   <button className="text-sm font-medium text-[#1b4f63] hover:underline mt-1">View Details</button>
                 </div>
               </div>
            ))}
          </div>
        ) : (
          <div className="p-space-12 text-center text-on-surface-variant flex flex-col items-center">
             {activeTab === 'completed' && <CheckCircle2 className="w-12 h-12 mb-4 text-outline-variant" />}
             {activeTab === 'cancelled' && <XCircle className="w-12 h-12 mb-4 text-outline-variant" />}
             {activeTab === 'disputed' && <AlertCircle className="w-12 h-12 mb-4 text-outline-variant" />}
             
             <p className="font-medium text-on-surface">No {activeTab} jobs</p>
             <p className="text-sm">When you have {activeTab} jobs, they will appear here.</p>
          </div>
        )}
      </div>

    </div>
  );
}
