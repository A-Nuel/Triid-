import { MapPin, Camera, Search, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function LocationSetup() {
  const navigate = useNavigate();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Example handling function for completing setup
  const completeSetup = () => {
    // Logic to save profile data to backend via auth token
    navigate('/artisan/dashboard');
  };

  if (showLocationPrompt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-[#143b4f] rounded-full flex items-center justify-center mb-space-6 shadow-xl relative">
            <div className="absolute w-full h-full border border-primary/20 rounded-full animate-ping"></div>
            <MapPin className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-space-3 tracking-tight">Enable Location Access</h2>
        <p className="text-sm text-on-surface-variant mb-space-8">
          So you get matched to nearby jobs and provide accurate ETAs to residents.
        </p>
        
        <button 
          onClick={completeSetup}
          className="w-full bg-[#1b4f63] text-white py-3 rounded-md font-semibold text-sm hover:bg-[#143b4f] transition-colors flex items-center justify-center gap-2 mb-space-4"
        >
          <MapPin className="w-4 h-4" /> Allow Access
        </button>
        <button 
          onClick={() => setShowLocationPrompt(false)}
          className="text-xs text-on-surface-variant font-medium hover:text-primary transition-colors"
        >
          Not now, enter manually
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-3xl font-bold text-primary mb-space-2 tracking-tight">Complete Your Profile, Emeka.</h2>
      <p className="text-sm text-on-surface-variant mb-space-8">
        Final touches to get you ready for jobs in Lagos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6 mb-space-10 flex-1">
        
        {/* Location Setup Card */}
        <div className="bg-white border text-left border-surface-variant rounded-xl p-space-8 flex flex-col hover:border-outline-variant transition-colors shadow-sm">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-space-6 border border-surface-variant">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-space-2">Set Your Location</h3>
          <p className="text-sm text-on-surface-variant mb-space-8 flex-1">
            So you get matched to nearby jobs quickly. We use this to calculate travel time and show you relevant local requests.
          </p>
          
          <button 
            onClick={() => setShowLocationPrompt(true)}
            className="w-full bg-[#1b4f63] text-white py-3 rounded-md font-semibold text-sm hover:bg-[#143b4f] transition-colors mb-space-3 flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" /> Use Current Location
          </button>
          
          <div className="relative">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Lagos, Nigeria" 
              className="w-full h-11 pl-space-10 pr-space-3 border border-outline-variant bg-surface-bright rounded-md text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
              readOnly
            />
          </div>
        </div>

        {/* Profile Photo Card */}
        <div className="bg-white border text-left border-surface-variant rounded-xl p-space-8 flex flex-col hover:border-outline-variant transition-colors shadow-sm">
          <h3 className="text-xl font-bold text-on-surface mb-space-2">Profile Photo</h3>
          <p className="text-sm text-on-surface-variant mb-space-8">
            Clients trust artisans with a clear, professional photo. This helps build your reputation on Triid.
          </p>
          
          <div className="flex-1 flex flex-col items-center justify-center mb-space-8">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center relative mb-space-4">
              <Camera className="w-8 h-8 text-outline-variant" />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#1b4f63] rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-primary transition-colors">
                <PenTool className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button className="w-full bg-surface-bright text-on-surface border border-outline-variant py-3 rounded-md font-bold text-sm hover:bg-surface transition-colors mb-space-3">
            Upload photo
          </button>
          <button className="w-full text-center text-xs text-on-surface-variant font-medium hover:text-primary transition-colors py-2">
            Skip for now
          </button>
        </div>

      </div>

      <div className="pt-space-6 border-t border-surface-variant mt-auto flex justify-end">
        <button 
          onClick={completeSetup}
          className="bg-[#1b4f63] text-white px-space-12 py-3 rounded-md font-semibold text-sm hover:bg-[#143b4f] transition-colors"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
}
