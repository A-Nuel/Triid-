import { useNavigate } from 'react-router-dom';
import { UserCircle, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function RoleSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectRole = async (role: 'resident' | 'artisan') => {
    // In a real app we'd save this to Supabase's user metadata or our users table
    if (user) {
      await supabase.auth.updateUser({
        data: { role }
      });
    }

    if (role === 'resident') {
      navigate('/resident/dashboard');
    } else {
      navigate('/onboarding/skills'); // Next step in artisan flow
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col items-center justify-center p-space-6 font-sans">
      <div className="max-w-xl w-full text-center mb-space-10">
        <h1 className="text-3xl font-bold text-primary mb-space-3 tracking-tight">How do you want to use Triid?</h1>
        <p className="text-sm text-on-surface-variant">Choose your path to get started with the Redemption City pilot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6 max-w-2xl w-full">
        {/* Resident Option */}
        <button 
          onClick={() => handleSelectRole('resident')}
          className="bg-white border border-surface-variant p-space-8 rounded-xl text-left hover:border-[#1b4f63] hover:shadow-md transition-all group flex flex-col"
        >
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-space-6 border border-surface-variant group-hover:bg-[#eaf5ff] transition-colors">
            <UserCircle className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-space-2">I am a Resident</h2>
          <p className="text-sm text-on-surface-variant">
            I want to quickly dispatch trusted artisans for emergencies and schedule planned repairs.
          </p>
        </button>

        {/* Artisan Option */}
        <button 
          onClick={() => handleSelectRole('artisan')}
          className="bg-white border border-surface-variant p-space-8 rounded-xl text-left hover:border-[#1b4f63] hover:shadow-md transition-all group flex flex-col"
        >
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-space-6 border border-surface-variant group-hover:bg-[#eaf5ff] transition-colors">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-space-2">I am an Artisan</h2>
          <p className="text-sm text-on-surface-variant">
            I am a skilled professional looking to receive job leads and verified escrow payouts.
          </p>
        </button>
      </div>
    </div>
  );
}
