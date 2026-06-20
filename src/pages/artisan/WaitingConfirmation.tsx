import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function WaitingConfirmation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [timeLeft, setTimeLeft] = useState(48 * 3600 - 4);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (data) setJob(data);
    }
    loadJob();
  }, [id]);

  useEffect(() => {
    // Basic countdown
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!job) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-surface-bright max-w-2xl mx-auto p-space-6 md:p-space-8 w-full">
      <button 
        onClick={() => navigate('/artisan/dashboard')}
        className="text-primary font-medium flex items-center gap-2 mb-space-8 hover:underline w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> Back to My Jobs
      </button>

      <div className="bg-white border flex-1 border-surface-variant rounded-2xl p-space-8 md:p-space-12 text-center flex flex-col items-center justify-center shadow-sm h-fit my-auto">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-space-6 border-8 border-green-50/50">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-primary mb-2">Job Complete</h1>
        <p className="text-on-surface-variant max-w-sm mx-auto mb-space-8">
          The resident has been notified to confirm the completion of this service request.
        </p>

        <div className="bg-[#f8fafc] w-full rounded-xl p-space-6 border border-surface-variant mb-space-8">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Payout Scheduled</p>
          <p className="text-4xl font-bold text-primary mb-space-2">₦{job.estimated_amount || '0.00'}</p>
          <p className="text-xs text-on-surface-variant">Includes labor and approved material advances</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-on-surface-variant bg-surface-variant/30 px-space-6 py-space-3 rounded-full border border-surface-variant">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Auto-release in <span className="font-mono font-bold text-primary ml-1">{formatTime(timeLeft)}</span></span>
        </div>
      </div>
      
      <div className="py-space-6">
        <button 
          onClick={() => navigate('/artisan/dashboard')}
          className="w-full bg-[#1b4f63] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#153e4d] shadow-md transition-transform active:scale-[0.98]"
        >
          Return to Dashboard
        </button>
      </div>

    </div>
  );
}
