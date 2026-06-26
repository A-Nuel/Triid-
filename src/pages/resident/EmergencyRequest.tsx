import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, MapPin, Loader2, ArrowLeft, TriangleAlert } from 'lucide-react';

export function EmergencyRequest() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Calls standard Modular Backend route via Vite proxy/Express middleware
      const response = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'emergency',
          description,
          location: { lat: 6.5244, lng: 3.3792 } // Mocking GPS coords
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setTriageResult(data);
      } else {
        alert("Failed to submit: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Network connection failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (triageResult) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col p-6 font-sans">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col pt-12">
          
          <div className="w-16 h-16 bg-[#ecfdf5] rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
            <ShieldAlert className="w-8 h-8 text-[#059669]" />
          </div>
          
          <h2 className="text-2xl font-bold text-[#1b4f63] mb-2 tracking-tight">Ping Broadcasting</h2>
          <p className="text-sm text-gray-500 mb-8">
            Triid AI has classified your issue and is hunting the nearest top-rated artisans.
          </p>
          
          {/* Triage Output Card */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm mb-12">
            <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-space-3">AI Diagnostics</h4>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                triageResult.urgency === 'critical' ? 'bg-critical-bg text-critical' : 'bg-warning-bg text-warning'
              }`}>
                {triageResult.urgency}
              </span>
              <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded text-[10px] font-bold uppercase">
                {triageResult.category}
              </span>
            </div>
            <p className="mt-space-4 font-semibold text-primary">{triageResult.summary}</p>
          </div>
          
          {/* Radar Animation */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-48 h-48 border border-primary/10 rounded-full animate-ping [animation-duration:3s]"></div>
              <div className="absolute w-32 h-32 border border-primary/20 rounded-full animate-ping [animation-duration:3s]" style={{ animationDelay: '1s' }}></div>
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center relative z-10 shadow-lg border-2 border-white">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="mt-space-10 text-sm font-bold text-primary animate-pulse tracking-wide">
              Matching artisans nearby...
            </p>
          </div>
          
          <div className="pt-8">
            <button 
              onClick={() => navigate('/resident/dashboard')}
              className="w-full border border-gray-200 bg-white text-gray-900 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all focus:ring-2 focus:ring-[#1b4f63]/30 focus:outline-none shadow-sm active:scale-[0.98]"
            >
              Cancel Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 shadow-sm z-10">
        <button onClick={() => navigate('/resident/dashboard')} className="p-2 -ml-2 text-gray-500 hover:text-[#1b4f63] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-[#1b4f63] tracking-tight">Emergency Request</span>
        <div className="w-9" /> {/* Spacer */}
      </header>
      
      <main className="flex-1 p-6 flex flex-col max-w-lg mx-auto w-full">
        
        <div className="bg-[#fef2f2] border-l-[3px] border-[#ef4444] p-4 rounded-r-xl mb-8 flex gap-3 shadow-sm">
          <TriangleAlert className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
          <p className="text-sm text-[#991b1b] font-medium leading-relaxed">
            This ping will bypass standard booking queues. A ₦5,000 baseline urgency hold will be placed in Escrow once matched.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col flex-1 mb-6">
            <label className="block text-lg font-bold text-gray-900 tracking-tight mb-2">Describe the Problem</label>
            <p className="text-sm text-gray-500 mb-4">
              Be as specific as possible (e.g. "Sparks coming from the main Mikano generator panel"). Triid's AI will parse this to dispatch the right artisan.
            </p>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4f63]/30 focus:border-[#1b4f63] transition-all min-h-[160px] bg-gray-50 focus:bg-white resize-none shadow-sm font-medium text-gray-900"
              placeholder="What is happening? Describe the failure..."
              autoFocus
            />

            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                <MapPin className="w-5 h-5 text-[#1b4f63]" />
                <span>Using Current Location</span>
              </div>
              <button type="button" className="text-xs font-bold text-[#1b4f63] hover:text-[#123644] transition-colors">
                Edit
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4 mb-4">
            <button 
              type="submit" 
              disabled={isSubmitting || !description.trim()}
              className="w-full bg-[#ef4444] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#dc2626] transition-all disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Broadcasting Ping...</>
              ) : (
                "Broadcast Emergency Ping"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
