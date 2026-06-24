import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, MessageSquare, CheckCircle2, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function EmergencyLiveTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobStatus, setJobStatus] = useState<string>("accepted");
  const [artisan, setArtisan] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      const { data } = await supabase
        .from('jobs')
        .select(`
          status,
          users!jobs_artisan_id_fkey (
            full_name,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (data) {
        setJobStatus(data.status);
        if (data.users) {
          setArtisan({ users: data.users });
        }
      }
    };
    fetchJob();

    const channel = supabase
      .channel(`public:jobs:id=eq.${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${id}` },
        (payload) => {
          setJobStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const getStatusDisplay = () => {
    switch (jobStatus) {
      case 'accepted': return { text: "Artisan En Route", color: "text-blue-600", dot: "bg-blue-500" };
      case 'in_progress': return { text: "Work in Progress", color: "text-orange-600", dot: "bg-orange-500" };
      case 'completed': return { text: "Work Completed", color: "text-green-600", dot: "bg-green-500" };
      default: return { text: "Connecting...", color: "text-gray-600", dot: "bg-gray-500" };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative focus:outline-none">
      {/* MAP MOCK BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-60 mix-blend-overlay pointer-events-none"></div>

      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex flex-col gap-1 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Live Tracking</h1>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot} animate-pulse`}></div>
          <span className={`text-sm font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-end p-4 z-10">
        
        {/* ARTISAN CARD */}
        {artisan && (
          <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-md mx-auto mb-4 border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 shrink-0">
                {artisan.users?.full_name?.charAt(0) || "A"}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{artisan.users?.full_name}</h2>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin className="w-4 h-4" /> 2 mins away
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${artisan.users?.phone}`} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition">
                  <Phone className="w-5 h-5 fill-current" />
                </a>
                <button className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition">
                  <MessageSquare className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>

            {jobStatus === 'completed' ? (
              <button
                onClick={() => navigate(`/resident/jobs/${id}/confirm`)}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-6 h-6" />
                Confirm & Release Payment
              </button>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 border border-gray-100">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                   <span className="text-blue-600 font-bold text-sm">i</span>
                 </div>
                 <p className="text-sm text-gray-600 leading-snug">
                   Your payment is safely held in escrow. Do not release funds until you have verified the work.
                 </p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
