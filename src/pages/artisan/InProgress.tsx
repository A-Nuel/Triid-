import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function InProgress() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [elapsed, setElapsed] = useState(0);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      const { data } = await supabase.from('jobs').select('*, resident:users!jobs_resident_id_fkey(full_name, phone)').eq('id', id).single();
      if (data) setJob(data);
    }
    loadJob();
  }, [id]);

  useEffect(() => {
    // Just a visual timer from load
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [actions, setActions] = useState([
    { id: '1', label: 'Arrive at location and assess task', checked: false },
    { id: '2', label: 'Communicate issue with resident', checked: false },
    { id: '3', label: 'Complete assigned task securely', checked: false },
  ]);

  const allChecked = actions.every(a => a.checked);

  const handleComplete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/v1/jobs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      navigate(`/artisan/waiting/${id}`);
    } catch(e) {
      console.error(e);
    }
  };

  if (!job) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-surface-bright max-w-4xl mx-auto p-space-6 md:p-space-8 w-full">
      <button 
        onClick={() => navigate('/artisan/dashboard')}
        className="text-gray-600 font-medium flex items-center gap-2 mb-8 hover:text-gray-900 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Service Requests &gt; TRD-{id?.slice(0,4)}
      </button>

      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-1.5 h-16 bg-[#1b4f63] rounded-full hidden md:block"></div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b4f63]" />
              <span className="text-[#1b4f63] text-xs font-bold tracking-widest uppercase">
                IN PROGRESS
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase mb-1">TRD-{job.id.slice(0,4)}</h1>
            <p className="text-gray-500 capitalize">{job.category} &amp; {job.description || 'Maintenance'}</p>
          </div>
        </div>
        <div className="bg-white px-6 py-4 rounded-xl border border-gray-200 flex flex-col items-center min-w-[160px]">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
            Elapsed Time
          </span>
          <span className="text-2xl font-mono font-bold text-gray-900 tracking-tight">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 flex-1">
        
        {/* Left Column - Contact & Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col h-fit">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Resident
          </h3>
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-6">
            <div className="w-12 h-12 bg-[#e0eaf3] text-[#1b4f63] rounded-full flex items-center justify-center text-xl font-bold shrink-0">
              {job.resident?.full_name?.charAt(0) || 'R'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{job.resident?.full_name || 'Resident'}</p>
              <p className="text-sm text-gray-500">Unit Pending</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-600 font-medium">
             <div className="flex items-center gap-3">
               <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
               {job.resident?.phone || 'No phone provided'}
             </div>
             <div className="flex items-center gap-3">
               <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
               {job.resident?.pet_info || '1 Dog (Friendly)'}
             </div>
          </div>
        </div>

        {/* Right Column - Checklist */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-gray-400" />
            Job Description
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {job.description || `Resident reported an issue requiring ${job.category} services. Please inspect and resolve appropriately.`}
          </p>

          <h4 className="text-xs font-bold text-gray-900 mb-3">Required Actions:</h4>
          <div className="space-y-3 flex-1">
            {actions.map((action, idx) => (
              <label key={action.id} className="flex items-start gap-3 cursor-pointer group">
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${action.checked ? 'bg-[#1b4f63] border-[#1b4f63]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                    {action.checked && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={action.checked}
                    onChange={(e) => {
                      const newActions = [...actions];
                      newActions[idx].checked = e.target.checked;
                      setActions(newActions);
                    }}
                  />
                </div>
                <span className={`text-sm transition-colors ${action.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {action.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-12 text-center flex flex-col items-center">
        <button 
          onClick={handleComplete}
          disabled={!allChecked}
          className={`w-full max-w-sm py-3.5 rounded-xl font-bold text-base flex justify-center items-center gap-2 transition-all mb-4 ${allChecked ? 'bg-[#1b4f63] text-white hover:bg-[#123644] shadow-md' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
        >
          <CheckCircle2 className="w-5 h-5" /> Mark job complete
        </button>
        <button className="text-sm font-bold text-gray-500 hover:text-gray-700">Need to report an issue?</button>
      </div>

    </div>
  );
}
