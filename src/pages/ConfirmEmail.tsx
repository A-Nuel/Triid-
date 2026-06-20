import { useState } from 'react';
import { Mail, MailCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function ConfirmEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    if (!email) {
      setMessage("Email address not found. Please try signing up again.");
      return;
    }
    
    setResending(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      setMessage("Verification email resent successfully.");
    } catch (err: any) {
      setMessage(err.message || 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  };

  const openEmailApp = () => {
    // A fallback attempt to open default mail clients
    window.location.href = 'mailto:';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-space-6 font-sans relative overflow-hidden" 
         style={{ background: 'linear-gradient(135deg, #f4f9fc 0%, #e8f3fa 100%)' }}>
      
      {/* Soft gradient orb in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/60 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] pt-12 pb-10 px-10 md:px-12 w-full max-w-[420px] relative z-10 flex flex-col items-center text-center border border-white/50">
        
        {/* Icon Container */}
        <div className="w-16 h-16 bg-[#edf4f9] rounded-xl flex items-center justify-center mb-6">
          <MailCheck className="w-8 h-8 text-[#1b4f63]" />
        </div>

        <h1 className="text-2xl font-bold text-[#0c1820] mb-3 tracking-tight">Check your email</h1>
        
        <p className="text-sm text-[#5d7280] font-medium leading-[1.6] mb-8">
          We've sent a verification link to your email.<br />
          Tap the link in the message to activate your<br />
          account and start using Triid.
        </p>

        {message && (
          <div className="w-full mb-6 p-3 bg-[#edf4f9] text-[#1b4f63] text-sm rounded-md font-semibold text-center border border-[#1b4f63]/10">
            {message}
          </div>
        )}

        <button 
          onClick={openEmailApp}
          className="w-full bg-[#1b4f63] text-white h-12 rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#143b4f] transition-colors mb-3 shadow-[0_2px_10px_rgba(27,79,99,0.2)]"
        >
          <Mail className="w-4 h-4" /> Open Email App
        </button>

        <button 
          onClick={handleResend}
          disabled={resending}
          className="w-full bg-white text-[#1b4f63] h-12 rounded-md font-semibold text-sm flex items-center justify-center border border-[#1b4f63] hover:bg-[#f4f9fc] transition-colors mb-8 disabled:opacity-50"
        >
          {resending ? 'Resending...' : 'Resend verification email'}
        </button>

        <button 
          onClick={() => navigate('/auth')}
          className="text-sm font-semibold text-[#5d7280] hover:text-[#1b4f63] underline underline-offset-4 decoration-[#5d7280]/30 hover:decoration-[#1b4f63] transition-all"
        >
          Change email address
        </button>
      </div>
    </div>
  );
}
