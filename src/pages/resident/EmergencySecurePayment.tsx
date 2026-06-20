import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function EmergencySecurePayment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      const { data } = await supabase.from('jobs').select('estimated_amount').eq('id', id).single();
      if (data) setEstimatedAmount(data.estimated_amount);
    };
    fetchJob();
  }, [id]);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Mock Paystack initiation
      const res = await fetch(`/api/v1/payments/jobs/${id}/initiate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) throw new Error("Payment initiation failed");

      // MOCK WEBHOOK FIRING FOR DEMO PURPOSES
      // In a real app, Paystack sends a webhook to our backend, which updates the DB.
      // Since we don't have a real Paystack test setup fully hooked up to a public URL for webhooks right now:
      await supabase.from('jobs').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', id);

      navigate(`/resident/emergency/tracking/${id}`);
    } catch (e: any) {
      alert("Payment failed: " + e.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} disabled={isProcessing} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-50">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Secure Escrow</h1>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center max-w-lg mx-auto w-full">
        <div className="mb-8 w-full">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            <h2 className="text-gray-500 font-medium mb-2">Total Amount</h2>
            <div className="text-4xl font-black text-gray-900 mb-6">
              ₦{estimatedAmount?.toLocaleString() || "..."}
            </div>
            
            <div className="bg-blue-50 text-blue-800 rounded-xl p-4 flex gap-3 text-left items-start">
              <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold mb-1">Funds Held Safely</h4>
                <p className="text-sm opacity-90">Triid holds your payment securely. The artisan is NOT paid until you confirm the job is 100% complete.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={handlePay}
            disabled={isProcessing || !estimatedAmount}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-black transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay with Card
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm font-medium mt-4">
            <Lock className="w-4 h-4" /> Secured by Paystack
          </div>
        </div>
      </main>
    </div>
  );
}
