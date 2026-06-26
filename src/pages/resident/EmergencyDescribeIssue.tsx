import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mic, AlertCircle, ImagePlus, Paperclip, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function EmergencyDescribeIssue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "other";
  
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setMediaUrls(prev => [...prev, data.url]);
    } catch (err) {
      alert("Failed to upload attachment");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() && mediaUrls.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const userLocation = "POINT(3.3912 -6.4531)"; 

      // Append media URLs to description if they exist
      const finalDescription = mediaUrls.length > 0 
        ? `${description}\n\nAttachments:\n${mediaUrls.map(url => `[ATTACHMENT] ${url}`).join('\n')}`
        : description;

      const res = await fetch("/api/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          mode: "emergency",
          description: finalDescription,
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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <header className="px-6 py-5 flex items-center justify-between border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4 w-1/3">
          <button onClick={() => navigate('/resident/emergency')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-[#001f29] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-[#001f29] tracking-tight text-lg">Tn.</span>
        </div>
        <div className="flex-1 flex justify-center w-1/3">
          <h1 className="text-[17px] font-bold text-[#001f29]">Problem Description</h1>
        </div>
        <div className="w-1/3" /> {/* Spacer */}
      </header>

      <main className="flex-1 p-6 flex flex-col max-w-3xl mx-auto w-full">
        <div className="bg-[#fee2e2] border-l-4 border-[#b91c1c] rounded-r-lg p-5 flex items-start gap-3 mb-8 shadow-sm">
          <AlertCircle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <h4 className="text-[#b91c1c] font-bold text-sm mb-1">Emergency Dispatch</h4>
            <p className="text-[#991b1b] text-sm leading-relaxed">
              This issue has been marked as high priority. Describe the problem clearly to ensure rapid response.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col mb-6">
          <label className="text-[15px] font-bold text-[#001f29] mb-3">What seems to be the problem?</label>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[300px]">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="E.g., The main water pipe burst in the basement and it's flooding rapidly..."
              className="w-full flex-1 p-5 text-[15px] text-[#001f29] placeholder:text-gray-400 focus:outline-none resize-none"
            />
            
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-4 text-gray-500">
                <label className="hover:text-[#001f29] transition-colors cursor-pointer relative">
                  <ImagePlus className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploadingMedia} />
                </label>
                <label className="hover:text-[#001f29] transition-colors cursor-pointer relative">
                  <Paperclip className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingMedia} />
                </label>
                {uploadingMedia && <span className="text-xs text-blue-600 animate-pulse">Uploading...</span>}
              </div>
              <button 
                title="Coming soon"
                onClick={() => alert("Voice note for emergency coming soon!")}
                className="w-10 h-10 rounded-full bg-[#001f29] text-white flex items-center justify-center hover:bg-black transition-colors shadow-md group relative">
                <Mic className="w-5 h-5" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                  Coming soon
                </span>
              </button>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <div className="text-xs text-blue-600 font-medium">
              {mediaUrls.length > 0 && `${mediaUrls.length} attachment(s) added`}
            </div>
            <span className="text-xs font-medium text-gray-400">{description.length}/500 characters</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <div className="bg-[#f1f5f9] text-[#001f29] px-4 py-2 rounded-full flex items-center gap-2 border border-gray-200 shadow-sm text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Classified as: <span className="capitalize">{category}</span> <span className="text-gray-300 mx-1">•</span> <span className="text-[#b91c1c]">Critical</span>
          </div>
        </div>

      </main>

      <footer className="bg-[#f8f9fa] p-6 pb-8 border-t border-transparent sticky bottom-0 z-10 max-w-3xl mx-auto w-full">
        <button
          onClick={handleSubmit}
          disabled={!description.trim() || isSubmitting}
          className="w-full py-4 bg-[#001f29] text-white rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          {isSubmitting ? "Finding Artisan..." : "Find Artisan"}
          {!isSubmitting && <ArrowRight className="w-5 h-5" />}
        </button>
      </footer>
    </div>
  );
}
