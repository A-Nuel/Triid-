import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Award, Shield, Check, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function RateAndVouch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isVouching, setIsVouching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [artisan, setArtisan] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchArtisan = async () => {
      const { data } = await supabase
        .from('jobs')
        .select(`artisan_id, artisan_profiles(users(full_name))`)
        .eq('id', id)
        .single();
      if (data) setArtisan({ id: data.artisan_id, ...data.artisan_profiles });
    };
    fetchArtisan();
  }, [id]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Submit Review
      await fetch(`/api/v1/jobs/${id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ rating, comment })
      });

      // Submit Vouch if toggled
      if (isVouching && artisan?.id) {
         await fetch(`/api/v1/vouches`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ vouchee_id: artisan.id, relationship: 'resident_to_artisan', note: "Vouched after a successful job." })
        });
      }

      navigate("/resident/dashboard");
    } catch (e: any) {
      alert("Submission failed: " + e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">How was the service?</h1>
        <p className="text-gray-500 mt-1">Rate your experience with {artisan?.users?.full_name || "the artisan"}.</p>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center max-w-lg mx-auto w-full">
        
        {/* Star Rating */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform active:scale-90"
            >
              <Star 
                className={cn(
                  "w-12 h-12 transition-colors",
                  (hoveredRating || rating) >= star 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "fill-gray-100 text-gray-200"
                )} 
              />
            </button>
          ))}
        </div>

        {/* Written Review */}
        <div className="w-full mb-8">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 text-gray-400" /> Optional Feedback
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What went well? Any issues?"
            className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
          />
        </div>

        {/* Community Vouch Toggle */}
        <div 
          onClick={() => setIsVouching(!isVouching)}
          className={cn(
            "w-full rounded-2xl p-4 border-2 transition-all cursor-pointer flex gap-4 items-start",
            isVouching ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <div className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors",
             isVouching ? "bg-blue-500 text-white" : "bg-gray-100 text-transparent"
          )}>
            <Check className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-2 text-gray-900">
              <Award className="w-4 h-4 text-orange-500" />
              Vouch for this Artisan
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Add your reputation to theirs. This boosts their Community Trust Tier and helps other residents. Use only if they did exceptional work.
            </p>
          </div>
        </div>

      </main>

      <footer className="p-4 border-t border-gray-100 bg-white">
         <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full max-w-lg mx-auto py-4 bg-gray-900 text-white rounded-xl font-bold text-lg disabled:opacity-50 transition active:scale-[0.98] flex items-center justify-center"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </footer>
    </div>
  );
}
