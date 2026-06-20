import { useState, useEffect } from 'react';
import { ShieldAlert, Hammer, MapPin, Sparkles, Navigation } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function EmergencyTakeover() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [timeLeft, setTimeLeft] = useState(88); // 1:28
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
        if (data) setJob(data);
      } catch (err) {} finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAccept = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/v1/jobs/${id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        navigate(`/artisan/en-route/${id}`);
      } else {
        alert("Job might have already been taken by someone else.");
        navigate('/artisan/dashboard');
      }
    } catch(e) {
      alert("Error accepting job");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center">Loading...</div>;
  if (!job) return <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center">Job not found or already claimed.</div>;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col items-center justify-center p-space-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-surface-variant overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-critical/5 p-space-8 flex flex-col items-center text-center relative border-b border-critical/10">
          <div className="absolute top-4 left-0 w-full flex justify-center">
            <span className="bg-critical-bg text-critical text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 bg-critical rounded-full animate-pulse" /> CRITICAL DISPATCH
            </span>
          </div>

          <div className="w-20 h-20 bg-critical-container/30 rounded-full flex items-center justify-center mt-space-8 mb-space-4">
            <div className="w-14 h-14 bg-critical text-white rounded-full flex items-center justify-center shadow-lg shadow-critical/20">
              <Hammer className="w-6 h-6" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-primary mb-1 capitalize">{job.category} Emergency</h1>
          <p className="text-xl font-semibold text-critical mb-space-6">₦{job.estimated_amount || '15,000'}</p>
          
          <div className="bg-white px-space-6 py-2 rounded-full border border-surface-variant shadow-sm flex items-center justify-center">
            <span className={`text-3xl font-mono tracking-tight font-bold ${timeLeft < 10 ? 'text-critical animate-pulse' : 'text-primary'}`}>
              {timeString}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-space-6 flex flex-col gap-space-4 bg-white flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Distance pending</p>
              <p className="text-xs text-on-surface-variant max-w-[250px] truncate">{job.location?.coordinates ? '[Location Data]' : 'Location pending'}</p>
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-blue-100 rounded-xl p-space-4 mt-space-2 relative">
            <h3 className="text-xs font-bold text-[#1b4f63] tracking-wider uppercase mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#f59e0b]" /> Event Summary
            </h3>
            <p className="text-sm text-primary leading-relaxed">
              {job.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-space-6 pt-0 flex gap-space-4 mt-auto bg-white">
          <button 
            className="flex-1 bg-surface-variant text-on-surface font-semibold py-4 rounded-xl hover:bg-outline-variant transition-colors"
            onClick={() => navigate('/artisan/dashboard')}
          >
            Decline
          </button>
          <button 
            className="flex-[2] bg-critical text-white font-bold text-lg py-4 rounded-xl hover:bg-[#b3261e] shadow-md shadow-critical/20 active:scale-95 transition-all flex justify-center items-center gap-2"
            onClick={handleAccept}
          >
            Accept Job
          </button>
        </div>
      </div>
    </div>
  );
}
