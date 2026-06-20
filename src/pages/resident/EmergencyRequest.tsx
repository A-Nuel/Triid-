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
      <div className="min-h-screen bg-surface-bright flex flex-col p-space-6 font-sans">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col pt-space-12">
          
          <div className="w-16 h-16 bg-success-bg rounded-full flex items-center justify-center mb-space-6 border-4 border-white shadow-sm">
            <ShieldAlert className="w-8 h-8 text-success" />
          </div>
          
          <h2 className="text-2xl font-bold text-primary mb-2 tracking-tight">Ping Broadcasting</h2>
          <p className="text-sm text-on-surface-variant mb-space-8">
            Triid AI has classified your issue and is hunting the nearest top-rated artisans.
          </p>
          
          {/* Triage Output Card */}
          <div className="bg-white border border-surface-variant p-space-6 rounded-xl shadow-sm mb-space-12">
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
              className="w-full border border-outline-variant bg-white text-on-surface py-3 rounded-md font-bold text-sm hover:bg-surface transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
            >
              Cancel Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="px-space-6 py-space-4 flex justify-between items-center bg-white border-b border-surface-variant sticky top-0">
        <button onClick={() => navigate('/resident/dashboard')} className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-primary">Emergency Request</span>
        <div className="w-9" /> {/* Spacer */}
      </header>
      
      <main className="flex-1 p-space-6 flex flex-col max-w-lg mx-auto w-full">
        
        <div className="bg-critical-bg border-l-[3px] border-critical p-space-4 rounded-r-md mb-space-8 flex gap-3">
          <TriangleAlert className="w-5 h-5 text-critical shrink-0 mt-0.5" />
          <p className="text-xs text-critical font-medium leading-relaxed">
            This ping will bypass standard booking queues. A ₦5,000 baseline urgency hold will be placed in Escrow once matched.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <label className="block text-sm font-bold text-on-surface mb-2">Describe the Problem</label>
          <p className="text-xs text-on-surface-variant mb-space-4">
            Be as specific as possible (e.g. "Sparks coming from the main Mikano generator panel"). Triid's AI will parse this to dispatch the right artisan.
          </p>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-outline-variant rounded-xl p-space-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[160px] bg-white resize-none shadow-sm"
            placeholder="What is happening? Describe the failure..."
            autoFocus
          />

          <div className="mt-space-6 flex items-center justify-between p-space-4 bg-surface rounded-lg border border-surface-variant">
            <div className="flex items-center gap-space-3 text-sm font-medium text-on-surface">
              <MapPin className="w-5 h-5 text-primary" />
              <span>Using Current Location</span>
            </div>
            <button type="button" className="text-xs font-bold text-[#2f6b80] hover:text-primary transition-colors">
              Edit
            </button>
          </div>

          <div className="mt-auto pt-space-10 mb-space-6">
            <button 
              type="submit" 
              disabled={isSubmitting || !description.trim()}
              className="w-full bg-critical text-white py-4 rounded-md font-bold text-lg hover:bg-[#b3261e] transition-colors disabled:opacity-50 disabled:bg-outline-variant shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
              ) : (
                 "Log Distress Ping"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
