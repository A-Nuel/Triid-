import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function ConfirmCompletion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [artisan, setArtisan] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      const { data } = await supabase
        .from('jobs')
        .select(`
          status,
          users!jobs_artisan_id_fkey (
            full_name
          )
        `)
        .eq('id', id)
        .single();
      
      if (data && data.users) {
        setArtisan({ users: data.users });
      }
    };
    fetchJob();
  }, [id]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`/api/v1/jobs/${id}/confirm`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error("Confirmation failed");

      // Successfully confirmed, go to rate & vouch
      navigate(`/resident/jobs/${id}/rate`);
    } catch (e: any) {
      alert("Error: " + e.message);
      setIsConfirming(false);
    }
  };

  const handleDispute = async () => {
    setIsDisputing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`/api/v1/jobs/${id}/dispute`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error("Dispute failed");
      
      alert("Dispute raised. A community admin will contact you.");
      navigate("/resident/dashboard");
    } catch (e: any) {
      alert("Error: " + e.message);
      setIsDisputing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Marked Complete</h2>
      <p className="text-gray-500 mb-8 max-w-sm">
        {artisan?.users?.full_name} has marked this job as completed. Please confirm to release their payment from escrow.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleConfirm}
          disabled={isConfirming || isDisputing}
          className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isConfirming ? "Confirming..." : "Confirm & Release Payment"}
        </button>
        
        <button
          onClick={handleDispute}
          disabled={isConfirming || isDisputing}
          className="w-full py-4 bg-white border border-gray-200 hover:bg-gray-50 text-red-600 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDisputing ? "Processing..." : "There is an Issue (Dispute)"}
          <AlertTriangle className="w-5 h-5 ml-1" />
        </button>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-gray-400 font-medium max-w-xs text-left">
        <ShieldCheck className="w-5 h-5 shrink-0" />
        Triid holds the payment until you confirm. False confirmations cannot be reversed.
      </div>
    </div>
  );
}
