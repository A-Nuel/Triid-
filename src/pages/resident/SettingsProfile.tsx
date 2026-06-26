import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, User, Upload, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';

export function SettingsProfile() {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { success, error } = useToast();

  // Phone Verification State
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    // Setup recaptcha
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!session) return;
      try {
        const res = await fetch('/api/v1/resident/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const { profile: p, user: u } = await res.json();
          setFullName(u?.user_metadata?.full_name || "");
          setEmail(u?.email || "");
          setPhotoUrl(u?.user_metadata?.avatar_url || "");
          setUsername(p?.username || "");
          setPhone(u?.user_metadata?.verified_phone || p?.phone || "");
          setIsPhoneVerified(!!u?.user_metadata?.phone_verified);
        }
      } catch (err) {
        console.error("Failed to load resident profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();
      setPhotoUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/resident/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ username, phone, full_name: fullName, avatar_url: photoUrl })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save");
      }
      success("Profile updated successfully");
      navigate('/resident/settings');
    } catch (err: any) {
      setErrorMsg(err.message);
      error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerification = async () => {
    if (!phone) return error("Please enter a phone number first.");
    setVerifying(true);
    try {
      // Ensure phone is E.164 format (e.g. +234...)
      const formattedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;
      const appVerifier = window.recaptchaVerifier;
      const confResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confResult);
      setShowVerifyModal(true);
      success("Verification code sent via SMS");
    } catch (err: any) {
      console.error(err);
      error("Failed to send verification code: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) return;
    setVerifying(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      const res = await fetch('/api/v1/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Server verification failed");
      }

      setIsPhoneVerified(true);
      setShowVerifyModal(false);
      success("Phone number verified successfully!");
    } catch (err: any) {
      console.error(err);
      error("Invalid code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Personal Information</h1>
        <p className="text-gray-500 mt-2">Update your resident profile details and contact information.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold mb-6">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Photo Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center w-full lg:w-72 flex-shrink-0 shadow-sm">
          <div className="w-32 h-32 rounded-full bg-[#f0f4f8] flex items-center justify-center text-gray-400 mb-6 border-4 border-white shadow-md overflow-hidden relative">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-[#1b4f63]" />
            ) : photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#eef2f6] hover:bg-[#e1eaef] text-[#1b4f63] font-bold py-2 px-6 rounded-lg text-sm transition-colors mb-3 flex items-center gap-2"
          >
            {uploading ? "Uploading..." : <><Upload className="w-4 h-4" /> Change Photo</>}
          </button>
          <p className="text-xs text-gray-400 font-medium">JPG, GIF or PNG. Max size of 800K</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 flex-1 shadow-sm w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
                  placeholder="e.g. chidi_o"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Phone Number</label>
                {isPhoneVerified ? (
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <button 
                    onClick={handleSendVerification}
                    disabled={verifying || !phone}
                    className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3 h-3" /> {verifying ? 'Sending...' : 'Verify Now'}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={isPhoneVerified}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="+234 802 345 6789"
              />
              {!isPhoneVerified && <p className="text-[10px] text-gray-400 mt-1">Phone number will remain private.</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              onClick={() => navigate('/resident/settings')}
              className="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-900 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#001f29] hover:bg-black text-white font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
      <div id="recaptcha-container"></div>

      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
            <button onClick={() => setShowVerifyModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6 mt-2 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Verify Phone Number</h3>
              <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code sent to {phone}</p>
            </div>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.5em] font-bold py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all mb-6"
              maxLength={6}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={verifying || otp.length < 6}
              className="w-full bg-[#1b4f63] text-white font-bold py-3.5 rounded-xl transition-all hover:bg-[#123644] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
