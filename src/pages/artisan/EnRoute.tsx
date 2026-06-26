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
      const { data, error } = await supabase.from('jobs').select('*, resident:users!jobs_resident_id_fkey(full_name, phone)').eq('id', id).single();
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
        className="text-gray-600 font-medium flex items-center gap-2 mb-8 hover:text-gray-900 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Jobs
      </button>

      <div className="bg-[#f0f4f8] rounded-xl p-5 mb-8 flex items-center gap-4 border border-[#e2e8f0]">
        <div className="w-12 h-12 bg-[#1b4f63] rounded-full flex items-center justify-center shrink-0">
          <Navigation className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">En route to job</h2>
          <p className="text-sm text-gray-500">Estimated arrival: 10 mins</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 flex-1">
        
        {/* Resident Contact Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col shadow-sm">
          <p className="text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Resident Contact</p>
          <h3 className="text-xl font-bold text-gray-900">{job.resident?.full_name || 'Resident'}</h3>
          <p className="text-sm text-gray-500 mb-8 capitalize">{job.category || 'Service'} - TRD-{job.id.slice(0,4)}</p>

          <div className="flex gap-4 mt-auto">
            <a href={`tel:${job.resident?.phone}`} className="flex-1 bg-[#dbeafe] text-[#1e40af] font-semibold py-3 rounded-xl hover:bg-[#bfdbfe] transition-colors flex justify-center items-center gap-2 text-sm">
              <PhoneCall className="w-4 h-4" /> Call
            </a>
            <button className="flex-1 bg-[#dbeafe] text-[#1e40af] font-semibold py-3 rounded-xl hover:bg-[#bfdbfe] transition-colors flex justify-center items-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4" /> Message
            </button>
          </div>
        </div>

        {/* Destination Map Card */}
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col shadow-sm overflow-hidden">
          <div className="p-6 pb-4">
            <p className="text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Destination</p>
            <h3 className="text-xl font-bold text-gray-900">Your Location</h3>
            <p className="text-sm text-gray-500">Grace Estate</p>
          </div>
          
          <div className="h-48 bg-gray-100 relative w-full mt-auto">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-50"></div>
            <div className="absolute inset-0 bg-[#1b4f63]/30"></div>
            <button className="absolute bottom-4 right-4 bg-white p-3 rounded-xl shadow-lg text-[#1b4f63]">
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <button 
          onClick={handleArrive}
          className="w-full bg-[#1b4f63] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#123644] shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <MapPin className="w-5 h-5" /> I've Arrived
        </button>
      </div>

    </div>
  );
}
