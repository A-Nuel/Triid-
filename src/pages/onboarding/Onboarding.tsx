import { useState } from 'react';
import { Network, PenTool, Zap, Droplet, Cog, Car, Shield, KeySquare, PlusCircle } from 'lucide-react';
import { LocationSetup } from './LocationSetup';
import { supabase } from '@/lib/supabase';

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const skills = [
    { id: 'electrician', name: 'Electrician', icon: <Zap className="w-6 h-6" /> },
    { id: 'plumber', name: 'Plumber', icon: <Droplet className="w-6 h-6" /> },
    { id: 'generator', name: 'Generator', icon: <Cog className="w-6 h-6" /> },
    { id: 'vehicle', name: 'Vehicle', icon: <Car className="w-6 h-6" /> },
    { id: 'security', name: 'Security', icon: <Shield className="w-6 h-6" /> },
    { id: 'hvac', name: 'HVAC', icon: <Network className="w-6 h-6" /> },
    { id: 'locksmith', name: 'Locksmith', icon: <KeySquare className="w-6 h-6" /> },
    { id: 'other', name: 'Other', icon: <PlusCircle className="w-6 h-6" /> },
  ];

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const nextStep = () => setStep(prev => prev + 1);

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col md:flex-row font-sans">
      {/* Sidebar / Progress Tracker */}
      <aside className="w-full md:w-64 lg:w-72 bg-surface border-r border-surface-variant p-space-6 flex flex-col">
        <h1 className="text-xl font-bold text-primary mb-space-1">Triid Onboarding</h1>
        <p className="text-xs text-on-surface-variant mb-space-10">Complete your profile</p>

        <nav className="space-y-space-6 text-sm font-medium">
          <div className={`flex items-center gap-space-3 ${step > 0 ? 'text-[#2f6b80]' : 'text-on-surface-variant'}`}>
            <Network className="w-5 h-5" /> Role Selection
          </div>
          <div className={`flex items-center gap-space-3 ${step > 0 ? 'text-[#2f6b80]' : 'text-on-surface-variant'}`}>
            <Network className="w-5 h-5 opacity-0" /> Account Access
          </div>
          <div className={`flex items-center gap-space-3 ${step === 1 || step === 2 ? 'text-primary font-bold border-r-2 border-primary' : 'text-on-surface-variant'}`}>
            <PenTool className="w-5 h-5" /> Profile Setup
          </div>
          <div className="flex items-center gap-space-3 text-on-surface-variant">
            <Shield className="w-5 h-5" /> Verification
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-space-6 md:p-space-12 bg-white flex flex-col">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
          
          {/* Progress Bar */}
          <div className="mb-space-10">
            <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant mb-space-3 tracking-wider uppercase">
              <span>Step {step} of 3</span>
              <span>{step === 1 ? 'Skills & Expertise' : step === 2 ? 'Location & Photo' : 'Identity Verification'}</span>
            </div>
            <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1b4f63] transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Dynamic Step Content */}
          {step === 1 ? (
            <div className="flex-1 flex flex-col">
              <h2 className="text-3xl font-bold text-primary mb-space-2 tracking-tight">What services do you offer?</h2>
              <p className="text-sm text-on-surface-variant mb-space-8">
                Select all the skills that apply to your expertise. This helps us match you with the right jobs.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-space-4 mb-space-10 flex-1">
                {skills.map(skill => {
                  const isSelected = selectedSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`h-32 rounded-xl flex flex-col items-center justify-center gap-space-3 border transition-all duration-200 ${
                        isSelected 
                          ? 'border-[#1b4f63] bg-surface text-[#1b4f63] shadow-sm' 
                          : 'border-surface-variant bg-surface-bright text-on-surface-variant hover:border-outline-variant hover:bg-white'
                      }`}
                    >
                      <div className={isSelected ? 'text-[#1b4f63]' : 'text-[#476273]'}>
                        {skill.icon}
                      </div>
                      <span className="text-sm font-semibold">{skill.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-space-6 border-t border-surface-variant mt-auto flex justify-end">
                <button 
                  onClick={nextStep}
                  disabled={selectedSkills.length === 0}
                  className="bg-[#1b4f63] text-white px-space-12 py-3 rounded-md font-semibold text-sm hover:bg-[#143b4f] transition-colors disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </div>
          ) : step === 2 ? (
            <LocationSetup skills={selectedSkills} onComplete={() => setStep(3)} />
          ) : (
            <IdentityVerificationSetup />
          )}

        </div>
      </main>
    </div>
  );
}

function IdentityVerificationSetup() {
  const [nin, setNin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeAndNavigate = () => {
    window.location.href = '/artisan/dashboard'; // direct route
  };

  const verifyNin = async () => {
    if (!nin.trim()) return;
    setIsSubmitting(true);
    try {
      const tokenResult = await supabase.auth.getSession();
      const token = tokenResult?.data?.session?.access_token;
      
      const res = await fetch('/api/v1/artisans/verify-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nin })
      });
      if (!res.ok) throw new Error("Failed to verify");
      
      completeAndNavigate();
    } catch (err) {
      console.error(err);
      alert("Failed to verify identity. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-3xl font-bold text-primary mb-space-2 tracking-tight">Verify Your Identity</h2>
      <p className="text-sm text-on-surface-variant mb-space-8">
        Verify your identity to unlock Vouched status, higher visibility, and advance payments.
      </p>

      <div className="bg-white border border-surface-variant rounded-xl p-space-8 shadow-sm max-w-lg">
        <label className="block text-sm font-bold text-on-surface mb-2">National Identity Number (NIN)</label>
        <input 
          type="text" 
          value={nin}
          onChange={e => setNin(e.target.value)}
          placeholder="Enter your 11-digit NIN" 
          className="w-full h-12 px-space-4 border border-outline-variant bg-surface-bright rounded-md text-sm focus:outline-none focus:border-primary transition-colors focus:bg-white"
        />
        <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
          Your NIN is checked securely to verify your identity. We do not store your actual number on our servers.
        </p>
      </div>

      <div className="pt-space-6 border-t border-surface-variant mt-auto flex justify-between items-center">
        <button 
          onClick={completeAndNavigate}
          className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          Skip for now
        </button>
        <button 
          onClick={verifyNin}
          disabled={!nin.trim() || isSubmitting}
          className="bg-[#1b4f63] text-white px-space-12 py-3 rounded-md font-semibold text-sm hover:bg-[#143b4f] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Verifying...' : 'Verify NIN'}
        </button>
      </div>
    </div>
  );
}
