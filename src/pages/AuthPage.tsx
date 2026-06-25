import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // After signup, direct them to onboarding (email confirmation is disabled for now)
        navigate('/onboarding/role');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            navigate('/confirm-email', { state: { email } });
            return;
          }
          throw error;
        }
        
        // Check if role is established
        if (data.user?.user_metadata?.role === 'resident') {
          navigate('/resident/dashboard');
        } else if (data.user?.user_metadata?.role === 'artisan') {
          navigate('/artisan/dashboard'); // Or onboarding if not completed, but routing to dashboard for now
        } else {
          navigate('/onboarding/role');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding/role`,
          skipBrowserRedirect: true
        }
      });
      if (error) throw error;
      
      if (data?.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_top';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright flex items-center justify-center p-space-6 font-sans">
      <div className="bg-white border border-surface-variant rounded-xl shadow-lg p-space-8 md:p-space-12 w-full max-w-md">
        <div className="text-center mb-space-8">
          <h1 className="text-2xl font-bold text-primary mb-space-2 tracking-tight">Welcome to Triid</h1>
          <p className="text-sm text-on-surface-variant">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-space-6 p-space-3 bg-critical-bg text-critical text-sm rounded-md border border-critical/20">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleSignIn}
          className="w-full mb-space-6 bg-primary text-white border border-primary h-12 rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
        >
          <span className="w-5 h-5 bg-white text-primary rounded-full flex items-center justify-center text-[10px] font-bold">G</span>
          Continue with Google
        </button>

        <div className="flex items-center gap-space-4 mb-space-6">
          <div className="flex-1 h-px bg-surface-dim"></div>
          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Or continue with email</p>
          <div className="flex-1 h-px bg-surface-dim"></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-space-5">
          <div>
            <label className="block text-xs font-medium text-on-surface mb-2">Email address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-11 px-space-3 text-sm border border-outline-variant rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-on-surface">Password</label>
              {!isSignUp && (
                <button type="button" className="text-xs text-[#2f6b80] hover:text-primary font-medium transition-colors">
                  Forgot password?
                </button>
              )}
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-space-3 text-sm border border-outline-variant rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1b4f63] text-white h-11 rounded-md font-semibold text-sm hover:bg-[#143b4f] transition-colors mt-space-2 disabled:opacity-70"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-space-8 text-center text-sm text-on-surface-variant">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold text-primary hover:text-[#2f6b80] transition-colors"
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
}
