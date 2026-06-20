import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Wrench, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function DemoRoleSelection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectRole = async (role: 'resident' | 'artisan') => {
    setLoading(role);
    try {
      // Get the provisioned credentials
      const res = await fetch('/api/v1/auth/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });
      
      const { email, password } = await res.json();
      
      // Sign in dynamically
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      // Route appropriately
      if (role === 'resident') {
        navigate('/resident/dashboard');
      } else {
        navigate('/artisan/dashboard');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to enter the demo. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="p-space-4">
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-surface-variant transition-colors">
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-space-6 max-w-lg mx-auto w-full">
        <div className="text-center mb-space-12 text-on-surface">
          <h1 className="text-4xl font-bold mb-space-4 tracking-tight">Enter Sandbox</h1>
          <p className="text-on-surface-variant">
            Explore the Triid platform from both perspectives. Both modes are functional and share the same matching and payment escrow engine.
          </p>
        </div>

        <div className="flex flex-col gap-space-4 w-full">
          <button 
            onClick={() => handleSelectRole('resident')}
            disabled={!!loading}
            className="flex items-center gap-space-4 p-space-6 bg-white border border-outline-variant hover:border-primary hover:shadow-md transition-all rounded-xl text-left disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-primary-container text-primary-fixed flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-on-surface">Try as Resident</h3>
              <p className="text-sm text-on-surface-variant">Log distress pings, browse artisans, and test the AI triage.</p>
            </div>
            {loading === 'resident' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
          </button>

          <button 
            onClick={() => handleSelectRole('artisan')}
            disabled={!!loading}
            className="flex items-center gap-space-4 p-space-6 bg-white border border-outline-variant hover:border-primary hover:shadow-md transition-all rounded-xl text-left disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-[#E5F6FD] text-[#0288D1] flex items-center justify-center flex-shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-on-surface">Try as Artisan</h3>
              <p className="text-sm text-on-surface-variant">Receive jobs, track progress, and test the escrow payout flow.</p>
            </div>
            {loading === 'artisan' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
}
