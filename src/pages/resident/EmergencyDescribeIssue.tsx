import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mic, Send, AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function EmergencyDescribeIssue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "other";
  
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // In a real app we'd get actual location via navigator.geolocation
      const userLocation = "POINT(3.3912 -6.4531)"; 

      const res = await fetch("/api/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          mode: "emergency",
          description,
          location: userLocation,
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Failed to submit emergency");
      }

      const data = await res.json();
      navigate(`/resident/emergency/matching/${data.data.id}`);
    } catch (e: any) {
      alert("Error: " + e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 capitalize">{category} Issue</h1>
      </header>

      <main className="flex-1 p-4 flex flex-col max-w-lg mx-auto w-full">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm font-medium">
            Stay safe. Describe the problem clearly so the responding artisan knows what to expect.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6 flex-1 flex flex-col">
          <label className="text-sm font-bold text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. The main breaker sparked and now half the house has no power..."
            className="w-full flex-1 p-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
             <button className="flex items-center justify-center p-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <Mic className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <MapPin className="w-4 h-4" />
              Redemption City
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white p-4 border-t border-gray-200 sticky bottom-0 z-10">
        <button
          onClick={handleSubmit}
          disabled={!description.trim() || isSubmitting}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isSubmitting ? "Finding Help..." : "Find Help Now"}
          {!isSubmitting && <Send className="w-5 h-5" />}
        </button>
      </footer>
    </div>
  );
}
