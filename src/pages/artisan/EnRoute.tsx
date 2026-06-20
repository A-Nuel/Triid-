import { useState, useEffect } from 'react';
import { ArrowLeft, PhoneCall, MessageCircle, MapPin, Navigation } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function EnRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      const { data, error } = await supabase.from('jobs').select('*, resident:resident_id(full_name, phone)').eq('id', id).single();
      if (data) setJob(data);
    }
    loadJob();
  }, [id]);

  const handleArrive = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/v1/jobs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: 'in_progress' })
      });
      navigate(`/artisan/in-progress/${id}`);
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

      <div className="flex flex-col md:flex-row justify-between md:items-end mb-space-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">En route to job</h1>
          <div className="flex items-center gap-2 text-on-surface-variant font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Estimated arrival: <span className="text-primary font-bold">10 mins</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6 mb-space-8 flex-1">
        
        {/* Resident Contact Card */}
        <div className="md:col-span-1 bg-white border border-surface-variant rounded-xl p-space-6 flex flex-col items-center text-center shadow-sm h-fit">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-space-4">
            {job.resident?.full_name?.charAt(0) || 'R'}
          </div>
          <h2 className="text-xl font-bold text-primary">{job.resident?.full_name || 'Resident'}</h2>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-space-6">Resident</p>

          <div className="flex gap-space-3 w-full">
            <button className="flex-1 bg-primary/10 text-primary font-semibold py-3 rounded-lg hover:bg-primary/20 transition-colors flex justify-center items-center gap-2">
              <PhoneCall className="w-5 h-5" /> Call
            </button>
            <button className="flex-1 bg-primary/10 text-primary font-semibold py-3 rounded-lg hover:bg-primary/20 transition-colors flex justify-center items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Message
            </button>
          </div>
        </div>

        {/* Destination Map Card */}
        <div className="md:col-span-2 bg-white border border-surface-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
          {/* Map Placeholder */}
          <div className="h-64 bg-surface-variant relative flex items-center justify-center">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#1E3A8A 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-10 relative border-2 border-primary">
              <Navigation className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <div className="p-space-6 bg-white flex items-start gap-4">
            <div className="w-12 h-12 bg-surface-variant rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-on-surface-variant" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary mb-1">Destination</h3>
              <p className="text-on-surface-variant">{job.location?.coordinates ? '[Location Data]' : 'Location pending'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-space-6 border-t border-surface-variant pb-12">
        <button 
          onClick={handleArrive}
          className="w-full bg-[#1b4f63] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#153e4d] shadow-md transition-transform active:scale-[0.98]"
        >
          I've Arrived
        </button>
      </div>

    </div>
  );
}
