import { ArrowLeft, User, MapPin, Calendar, Clock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RequestDetails() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto p-space-6 md:p-space-8 w-full font-sans">
      <button 
        onClick={() => navigate('/artisan/dashboard')}
        className="text-primary font-medium flex items-center gap-2 mb-space-8 hover:underline w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Job Feed
      </button>

      <div className="bg-white border border-surface-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-[#fef3c7] p-space-6 border-b border-[#fde68a]">
          <span className="text-[#92400e] text-xs font-bold px-2 py-1 flex w-fit items-center gap-1 rounded-sm tracking-widest uppercase mb-space-4 bg-white/50">
            Urgent Request
          </span>
          <h1 className="text-2xl font-bold text-[#92400e] mb-1">AC/HVAC Servicing</h1>
          <p className="text-[#92400e]/80 text-sm font-medium">Diagnostic & Repair</p>
        </div>

        <div className="p-space-6 space-y-space-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6 pb-space-6 border-b border-surface-variant">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Resident
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">T</div>
                <span className="font-semibold text-primary">Thomas K.</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </p>
              <p className="font-medium text-primary">8900 Bellaire Blvd, Apt 412</p>
              <p className="text-sm text-on-surface-variant">Zone D</p>
            </div>
          </div>

          <div className="pb-space-6 border-b border-surface-variant">
             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Job Description</p>
             <p className="text-primary leading-relaxed text-sm">
               The air conditioning unit in the master bedroom has completely stopped cooling. It makes a loud humming noise when turned on but no air comes out. Need this looked at urgently as it's very hot.
             </p>
          </div>
          
          <div>
            <div className="bg-surface-bright rounded-xl p-space-4 flex flex-col sm:flex-row sm:items-center justify-between border border-surface-variant gap-4">
              <div className="flex items-center gap-4 text-primary">
                <Calendar className="w-6 h-6 text-[#1b4f63]" />
                <div>
                  <p className="font-bold">Today, 14th Oct</p>
                  <p className="text-sm text-on-surface-variant flex items-center gap-1">
                    <Clock className="w-3 h-3" /> As soon as possible
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-bold tracking-tight">~ ₦12,500</p>
                <p className="text-xs text-on-surface-variant">Estimated based on description</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-space-6 bg-surface-bright border-t border-surface-variant flex gap-space-4">
          <button 
            onClick={() => navigate('/artisan/dashboard')}
            className="flex-[1] font-semibold text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-variant/50 rounded-lg py-3"
          >
            Decline
          </button>
          <button 
            onClick={() => navigate('/artisan/en-route/temp-2')}
            className="flex-[2] bg-[#1b4f63] text-white font-bold py-3 rounded-lg hover:bg-[#153e4d] shadow-sm flex justify-center items-center gap-2 transition-all active:scale-95"
          >
            <Check className="w-5 h-5" /> Accept Request
          </button>
        </div>
      </div>
    </div>
  );
}
