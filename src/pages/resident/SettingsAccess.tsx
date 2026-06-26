import { useState, useEffect } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function SettingsAccess() {
  const { session } = useAuth();
  
  const [estateName, setEstateName] = useState("");
  const [blockChalet, setBlockChalet] = useState("");
  const [instructions, setInstructions] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!session) return;
      try {
        const res = await fetch('/api/v1/resident/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const { profile: p } = await res.json();
          setEstateName(p?.estate_name || "");
          setBlockChalet(p?.block_chalet || "");
          setInstructions(p?.default_gate_instructions || "");
        }
      } catch (err) {
        console.error("Failed to load resident profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

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
        body: JSON.stringify({ estate_name: estateName, block_chalet: blockChalet, default_gate_instructions: instructions })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Address & Gated Access</h1>
          <p className="text-gray-500 mt-2">Manage your registered residential location and visitor instructions.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#001f29] hover:bg-black text-white font-bold rounded-lg transition-colors text-sm flex items-center gap-2 shadow-sm"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Forms column */}
        <div className="flex-1 space-y-6 w-full">
          {/* Location Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-gray-400" /> Location Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Estate Name</label>
                <input
                  type="text"
                  value={estateName}
                  onChange={e => setEstateName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
                  placeholder="e.g. Grace Estate"
                />
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Managed by Redemption City Admin</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Block/Chalet</label>
                <input
                  type="text"
                  value={blockChalet}
                  onChange={e => setBlockChalet(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
                  placeholder="e.g. Block 4, Chalet 7B"
                />
              </div>
            </div>
          </div>

          {/* Default Gate Instructions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs">💬</span> 
              Default Gate Instructions
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              These instructions are automatically appended to visitor passes and visible to main gate security.
            </p>
            <textarea
              rows={4}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all resize-none text-sm"
              placeholder="Tell security you are coming to see Chidi..."
            />
          </div>
        </div>

        {/* Registered Zone column */}
        <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
            <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs">🗺️</span> 
            Registered Zone
          </h3>
          
          {/* Map placeholder */}
          <div className="w-full aspect-square bg-[#5f7a75] rounded-xl overflow-hidden relative mb-4">
            <div className="absolute inset-4 bg-[#7a938e] rounded-lg border border-[#8da5a0] flex flex-col p-2 opacity-80">
               {/* Mock map pattern */}
               <div className="flex-1 grid grid-cols-4 gap-2">
                 <div className="bg-[#a6beab] rounded-sm"></div>
                 <div className="bg-[#a6beab] rounded-sm col-span-2"></div>
                 <div className="bg-[#a6beab] rounded-sm"></div>
                 <div className="bg-[#a6beab] rounded-sm col-span-3"></div>
                 <div className="bg-[#a6beab] rounded-sm"></div>
               </div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500">
                 <MapPin className="w-8 h-8 fill-current" />
               </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-white px-3 py-1.5 rounded-md text-xs font-bold text-gray-700 flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Location Verified
            </div>
          </div>

          <div className="bg-[#eef2f6] rounded-xl p-4 border border-[#d1dee6]">
            <p className="text-xs font-bold text-gray-600 mb-1">Access Level</p>
            <p className="text-sm font-bold text-gray-900 mb-2">Level 2 (Resident Main)</p>
            <p className="text-xs text-gray-500">Allows unescorted entry through Main and East gates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
