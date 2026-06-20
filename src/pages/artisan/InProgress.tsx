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
      const { data } = await supabase.from('jobs').select('*, resident:resident_id(full_name, phone)').eq('id', id).single();
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
        className="text-primary font-medium flex items-center gap-2 mb-space-8 hover:underline w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> Back to My Jobs
      </button>

      {/* Top Banner */}
      <div className="bg-[#1b4f63] text-white rounded-2xl p-space-6 md:p-space-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-space-6 mb-space-8 shadow-md">
        <div>
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-sm tracking-widest uppercase mb-space-3 inline-block">
            In Progress
          </span>
          <h1 className="text-2xl font-bold tracking-tight capitalize">{job.category} Job</h1>
        </div>
        <div className="bg-white/10 px-space-6 py-space-3 rounded-xl border border-white/20 flex flex-col items-center">
          <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Elapsed Time
          </span>
          <span className="text-3xl font-mono font-bold tracking-tight">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6 mb-space-8 flex-1">
        
        {/* Left Column - Contact & Summary */}
        <div className="md:col-span-1 space-y-space-6">
          <div className="bg-white border border-surface-variant rounded-xl p-space-6 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-space-4">Resident</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl font-bold text-primary">
                {job.resident?.full_name?.charAt(0) || 'R'}
              </div>
              <div>
                <p className="font-bold text-primary">{job.resident?.full_name || 'Resident'}</p>
                <p className="text-sm text-on-surface-variant">Unit Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-surface-variant rounded-xl p-space-6 shadow-sm">
             <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-space-4">Pricing Estimate</h3>
             <p className="text-2xl font-bold text-primary">₦{job.estimated_amount || '0.00'}</p>
             <p className="text-sm text-on-surface-variant mt-1">Funds currently held in secure escrow. Final amount is subject to mutual confirmation.</p>
          </div>
        </div>

        {/* Right Column - Checklist */}
        <div className="md:col-span-2 bg-white border border-surface-variant rounded-xl p-space-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-space-6">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-primary tracking-tight">Required Actions</h2>
          </div>

          <div className="space-y-space-4 flex-1">
            {actions.map((action, idx) => (
              <label key={action.id} className="flex items-start gap-4 p-4 rounded-xl border border-surface-variant hover:border-primary/50 cursor-pointer transition-colors bg-[#f8fafc]">
                <div className="pt-0.5">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-primary" 
                    checked={action.checked}
                    onChange={(e) => {
                      const newActions = [...actions];
                      newActions[idx].checked = e.target.checked;
                      setActions(newActions);
                    }}
                  />
                </div>
                <span className={`text-base font-medium transition-colors ${action.checked ? 'text-on-surface-variant line-through' : 'text-primary'}`}>
                  {action.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="py-space-6 border-t border-surface-variant pb-12">
        <button 
          onClick={handleComplete}
          disabled={!allChecked}
          className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all ${allChecked ? 'bg-green-600 text-white hover:bg-green-700 shadow-md active:scale-[0.98]' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}`}
        >
          <CheckCircle2 className="w-6 h-6" /> Mark job complete
        </button>
      </div>

    </div>
  );
}
