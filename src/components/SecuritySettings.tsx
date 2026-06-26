import { useState } from 'react';
import { Lock, Shield, Smartphone, AlertTriangle, Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function SecuritySettings() {
  const { session } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutOtherDevices = async () => {
    alert("This feature requires advanced session invalidation APIs and will be wired in the future. For now, updating your password will effectively sign you out of all devices.");
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#f0f4f8] rounded-xl flex items-center justify-center text-[#1b4f63]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-sm font-semibold mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1b4f63] focus:ring-1 focus:ring-[#1b4f63] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1b4f63] focus:ring-1 focus:ring-[#1b4f63] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-[#001f29] hover:bg-black text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      </section>

      {/* Two-Factor Authentication Placeholder */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#f0f4f8] rounded-xl flex items-center justify-center text-[#1b4f63]">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Two-Factor Authentication (2FA)</h3>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
          </div>
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Coming Soon
          </span>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <Smartphone className="w-6 h-6 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Authenticator App</p>
            <p className="text-xs text-gray-500 mt-0.5">Use an app like Google Authenticator to generate verification codes.</p>
          </div>
          <button disabled className="ml-auto px-4 py-2 bg-gray-200 text-gray-500 font-bold rounded-lg text-xs opacity-50 cursor-not-allowed">
            Setup
          </button>
        </div>
      </section>

      {/* Active Sessions */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#f0f4f8] rounded-xl flex items-center justify-center text-[#1b4f63]">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Active Sessions</h3>
            <p className="text-sm text-gray-500">Manage devices that are currently logged into your account.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-bold text-gray-900">Current Session</p>
                <p className="text-xs text-gray-600">This Device</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-700 bg-green-200/50 px-2.5 py-1 rounded-md">Active Now</span>
          </div>

          <button 
            onClick={handleSignOutOtherDevices}
            className="w-full p-4 border border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Sign Out of All Other Devices
          </button>
        </div>
      </section>
    </div>
  );
}
