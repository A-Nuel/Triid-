import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Zap, CheckCircle2, MapPin, Star, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function EmergencyMatching() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [jobStatus, setJobStatus] = useState<string>("pending");
  const [artisan, setArtisan] = useState<any>(null);
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    // Initial fetch
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          status,
          estimated_amount,
          artisan_profiles (
            id,
            average_rating,
            verification_status,
            users (
              full_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (data) {
        setJobStatus(data.status);
        if (data.status === 'matched' && data.artisan_profiles) {
          setArtisan(data.artisan_profiles);
          setEstimatedAmount(data.estimated_amount);
        }
      }
    };
    fetchJob();

    // Subscribe to changes
    const channel = supabase
      .channel(`public:jobs:id=eq.${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${id}`
        },
        async (payload) => {
          const newStatus = payload.new.status;
          setJobStatus(newStatus);
          if (newStatus === 'matched') {
            fetchJob(); // Fetch again to get joined artisan data
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleProceedToPayment = () => {
    navigate(`/resident/emergency/payment/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col p-6 text-white text-center relative w-full">
      
      {jobStatus === 'pending' && (
        <div className="absolute top-6 left-6">
          <button 
            onClick={() => navigate('/resident/dashboard')}
            className="px-4 py-2 bg-gray-800 rounded-full text-sm font-medium hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center items-center">
        {jobStatus === 'pending' && (
          <div className="flex flex-col items-center max-w-sm">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full animate-pulse"></div>
              <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-gray-700 flex items-center justify-center relative z-10">
                <Zap className="w-10 h-10 text-blue-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3">Pinging Artisans...</h2>
            <p className="text-gray-400 text-lg">Finding the closest available professional for this emergency.</p>
          </div>
        )}

        {jobStatus === 'matched' && artisan && (
          <div className="flex flex-col items-center max-w-sm w-full animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Match Found!</h2>
            <p className="text-gray-300 mb-8">An artisan is ready to accept your request.</p>

            <div className="bg-white text-gray-900 rounded-2xl p-6 w-full text-left shadow-xl mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                  {artisan.users?.full_name?.charAt(0) || "A"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-bold text-xl truncate">{artisan.users?.full_name}</h3>
                    {artisan.verification_status === 'verified' && (
                      <div className="flex-shrink-0 text-green-500">
                        <ShieldCheck className="w-5 h-5" title="ID Verified" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-600 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    {artisan.average_rating || "New"}
                    <span className="mx-2 text-gray-300">•</span>
                    <MapPin className="w-4 h-4 text-blue-500" />
                    1.2 km away
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <span className="text-gray-500 font-medium">Estimated Cost</span>
                <span className="text-xl font-black">₦{estimatedAmount?.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition active:scale-[0.98] shadow-lg shadow-blue-600/20"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
