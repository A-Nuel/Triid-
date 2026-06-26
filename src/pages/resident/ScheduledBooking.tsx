import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Loader2, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function ScheduledBooking() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !date || !time) return;

    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({
          mode: 'scheduled',
          artisan_id: id,
          description,
          scheduled_for: `${date}T${time}:00Z`,
          location: "POINT(3.3912 -6.4531)"
        })
      });

      const responseData = await response.json();
      if (response.ok) {
        navigate(`/resident/emergency/payment/${responseData.data.id}`);
      } else {
        alert("Failed to submit: " + (responseData.error?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Network connection failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-[#1b4f63] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-[#1b4f63] tracking-tight">Schedule Job</span>
        <div className="w-9" />
      </header>
      
      <main className="flex-1 p-6 flex flex-col max-w-lg mx-auto w-full">
        
        <div className="bg-[#f0f6fa] border-l-[3px] border-[#1b4f63] p-4 rounded-r-xl mb-8 flex gap-3 shadow-sm">
          <Info className="w-5 h-5 text-[#1b4f63] shrink-0 mt-0.5" />
          <p className="text-sm text-[#3c5a6b] font-medium leading-relaxed">
            Your payment will be held securely in escrow. Funds are only released to the artisan once you confirm the job is completed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-2">When do you need them?</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4f63]/30 focus:border-[#1b4f63] transition-all font-medium text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Time</label>
              <div className="relative">
                <Clock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4f63]/30 focus:border-[#1b4f63] transition-all font-medium text-gray-900"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
            <label className="block text-lg font-bold text-gray-900 tracking-tight mb-2">Job Description</label>
            <p className="text-sm text-gray-500 mb-4">
              Describe what needs to be done.
            </p>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4f63]/30 focus:border-[#1b4f63] transition-all min-h-[140px] bg-gray-50 focus:bg-white resize-none font-medium text-gray-900"
              placeholder="e.g. I need my 2 split AC units serviced and cleaned..."
              required
            />
          </div>

          <div className="mt-auto pt-8 mb-4">
            <button 
              type="submit" 
              disabled={isSubmitting || !description.trim() || !date || !time}
              className="w-full bg-[#1b4f63] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#123644] transition-all disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                 "Review & Pay to Escrow"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
