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
        className="text-gray-600 font-medium flex items-center gap-2 mb-8 hover:text-gray-900 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Job Details
      </button>

      <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 border border-gray-100 overflow-hidden relative mb-8">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
        <div className="p-8 md:p-12 flex flex-col items-center text-center">
          <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2 border border-orange-100">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            Waiting for Confirmation
          </div>
          <p className="text-gray-600 font-medium mb-2">Job Complete. Total Payout Scheduled:</p>
          <h2 className="text-5xl md:text-6xl font-bold text-[#0f2c38] mb-10">₦{job.estimated_amount?.toLocaleString() || '15,000'}</h2>
          
          <div className="bg-[#f0f6fa] rounded-xl p-5 border border-[#d6e4ef] w-full max-w-lg">
            <div className="flex items-start gap-3 mb-4 text-left">
              <div className="w-5 h-5 rounded-full border-2 border-[#1b4f63] text-[#1b4f63] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">i</div>
              <p className="text-[#3c5a6b] text-sm leading-relaxed">
                Payment releases once the resident confirms the job is satisfactory, or automatically after 48 hours.
              </p>
            </div>
            <div className="bg-white border border-[#d6e4ef] rounded-lg px-4 py-3 flex justify-between items-center text-sm font-medium">
              <span className="text-gray-600">Auto-release in:</span>
              <span className="text-orange-600 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-3 text-lg">Job Summary</h3>
        <div className="bg-[#f0f4f8] rounded-xl p-5 border border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#e0eaf3] text-[#1b4f63] rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 capitalize">{job.category} - {job.description || 'Repair'}</h4>
              <p className="text-sm text-gray-500">Unit Pending • Resident: {job.resident?.full_name?.split(' ')[0] || 'Unknown'}</p>
            </div>
          </div>
          <button className="text-sm font-bold text-[#1b4f63] hover:underline">View Details</button>
        </div>
      </div>
      
      <div className="pb-12 text-center flex flex-col items-center">
        <button className="text-sm font-bold text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-gray-500 text-gray-500 flex items-center justify-center shrink-0 font-bold text-[10px]">?</div>
          Issue with confirmation? Contact Support
        </button>
      </div>

    </div>
  );
}
