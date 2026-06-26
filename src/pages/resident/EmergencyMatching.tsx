import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HelpCircle, CheckCircle2, MapPin, Star, ShieldCheck, X, Radar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoAccount } from "@/lib/demoUtils";

export function EmergencyMatching() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [jobStatus, setJobStatus] = useState<string>("pending");
  const [artisan, setArtisan] = useState<any>(null);
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);

  const [isChatting, setIsChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState<{sender: 'resident' | 'artisan', text: string}[]>([]);
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  
  const isDemo = isDemoAccount(user?.email);

  useEffect(() => {
    if (!id) return;

    // Initial fetch
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          status,
          estimated_amount,
          users!jobs_artisan_id_fkey (
            id,
            full_name,
            artisan_profiles (
              id,
              average_rating,
              verification_status
            )
          )
        `)
        .eq('id', id)
        .single();

      if (data) {
        setJobStatus(data.status);
        if ((data.status === 'matched' || data.status === 'accepted') && data.users) {
          const u = data.users as any;
          const profile = Array.isArray(u.artisan_profiles) ? u.artisan_profiles[0] : u.artisan_profiles;
          
          setArtisan({
            id: profile?.id,
            average_rating: profile?.average_rating,
            verification_status: profile?.verification_status,
            users: { full_name: u.full_name }
          });
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
          if (newStatus === 'matched' || newStatus === 'accepted') {
            fetchJob();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (isChatting) {
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      
      timeouts.push(setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'resident', text: 'Hi, I have an emergency!' }]);
      }, 500));

      timeouts.push(setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'artisan', text: `Hello, I'm on my way. I'll be there in 15 mins.` }]);
      }, 2000));
      
      timeouts.push(setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'resident', text: 'Okay, thank you!' }]);
      }, 3500));

      timeouts.push(setTimeout(() => {
        setShowPaymentButton(true);
      }, 4500));

      return () => timeouts.forEach(clearTimeout);
    }
  }, [isChatting]);

  const handleContactArtisan = () => {
    setIsChatting(true);
  };

  const handleProceedToPayment = () => {
    navigate(`/resident/emergency/payment/${id}`);
  };

  const handleCancel = async () => {
    if (!id || !session) return;
    try {
      await fetch(`/api/v1/jobs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: "cancelled" })
      });
      navigate('/resident/dashboard');
    } catch (err) {
      console.error("Failed to cancel job", err);
      navigate('/resident/dashboard');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-hidden bg-[#8ca8b0]">
      {/* Background Map Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      {/* Overlay gradient to focus center */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#8ca8b0_80%)]" />

      {/* Top Bar (Scanning) */}
      {jobStatus === 'pending' && (
        <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-start z-20">
          <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center font-bold text-[#001f29] shadow-md">
            Tn.
          </div>
          <button className="bg-white rounded-full w-10 h-10 flex items-center justify-center text-[#001f29] shadow-md hover:bg-gray-50 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center z-10 p-6">
        {jobStatus === 'pending' && (
          <>
            {/* Center Target Icon */}
            <div className="relative flex items-center justify-center mb-10">
              {/* Outer pulsing rings */}
              <div className="absolute w-[300px] h-[300px] border-2 border-white/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              <div className="absolute w-[200px] h-[200px] border-2 border-white/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>
              
              <div className="w-20 h-20 bg-[#2d5663] rounded-full flex items-center justify-center border-4 border-white shadow-xl z-10 relative">
                <Radar className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Bottom Sheet Card */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-in slide-in-from-bottom-10 duration-500">
              <h2 className="text-[19px] font-bold text-[#001f29] mb-1">Scanning for nearby artisans...</h2>
              <p className="text-gray-500 text-sm mb-5">Searching... This usually takes less than a minute.</p>
              
              <div className="bg-[#e0f2fe] text-[#0369a1] px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs mb-6 w-max">
                <Radar className="w-3.5 h-3.5" />
                Expanding search radius (5km)
              </div>

              <button 
                onClick={handleCancel}
                className="w-full py-3.5 border-2 border-gray-100 bg-white rounded-xl font-bold text-[#001f29] text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel search
              </button>
            </div>
          </>
        )}

        {(jobStatus === 'matched' || jobStatus === 'accepted') && artisan && (
          <div className="flex flex-col items-center max-w-sm w-full animate-in slide-in-from-bottom-8 duration-500 bg-white p-8 rounded-3xl shadow-2xl">
            <div className="w-20 h-20 bg-[#2d5663] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#2d5663]/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-[#001f29]">Match Found!</h2>
            <p className="text-gray-500 mb-8 text-center">An artisan is ready to accept your request.</p>

            <div className="bg-[#f8f9fa] border border-gray-100 rounded-2xl p-6 w-full text-left mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#2d5663] rounded-full flex items-center justify-center text-xl font-bold text-white shadow-inner">
                  {artisan.users?.full_name?.charAt(0) || "A"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-bold text-xl text-[#001f29] truncate">{artisan.users?.full_name}</h3>
                    {artisan.verification_status === 'verified' && (
                      <div className="flex-shrink-0 text-green-600">
                        <ShieldCheck className="w-5 h-5" title="ID Verified" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-500 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    {artisan.average_rating || "New"}
                    <span className="mx-2 text-gray-300">•</span>
                    <MapPin className="w-4 h-4 text-[#2d5663]" />
                    1.2 km away
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
                <span className="text-gray-500 font-bold text-sm">Estimated Cost</span>
                <span className="text-xl font-black text-[#001f29]">₦{estimatedAmount?.toLocaleString()}</span>
              </div>
            </div>

            {isDemo ? (
              !isChatting ? (
                <button
                  onClick={handleContactArtisan}
                  className="w-full py-4 bg-[#001f29] hover:bg-black text-white rounded-xl font-bold text-lg transition-colors shadow-lg mt-2"
                >
                  Contact Artisan
                </button>
              ) : (
                <div className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-md mb-2">
                  <div className="text-left text-sm text-gray-500 font-bold border-b border-gray-200 pb-2 mb-2">Live Chat</div>
                  {chatMessages.length === 0 && (
                    <div className="flex justify-center my-4">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 bg-[#001f29] rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-[#001f29] rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-[#001f29] rounded-full animate-bounce delay-200"></span>
                      </span>
                    </div>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'resident' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                        msg.sender === 'resident' 
                          ? 'bg-[#001f29] text-white rounded-tr-sm' 
                          : 'bg-white border border-gray-200 text-[#001f29] rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {showPaymentButton && (
                    <button
                      onClick={handleProceedToPayment}
                      className="w-full py-3.5 mt-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-md animate-in fade-in duration-300"
                    >
                      Proceed to Payment
                    </button>
                  )}
                </div>
              )
            ) : (
              <button
                onClick={handleProceedToPayment}
                className="w-full py-4 bg-[#001f29] hover:bg-black text-white rounded-xl font-bold text-lg transition-colors shadow-lg mt-2"
              >
                Proceed to Payment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
