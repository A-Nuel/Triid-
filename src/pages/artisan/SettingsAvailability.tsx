import { AlertOctagon, Calendar as CalendarIcon, Info, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { offlineGet, offlinePost } from "@/lib/offlineApi";

export function SettingsAvailability() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [emergencyEnabled, setEmergencyEnabled] = useState(true);
  const [standardEnabled, setStandardEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Simple state for grid toggle (Mon-Sun, AM/PM)
  const [availability, setAvailability] = useState<{ [key: string]: boolean }>({
    'Mon-AM': true, 'Mon-PM': true,
    'Tue-AM': true, 'Tue-PM': true,
    'Wed-AM': true, 'Wed-PM': false,
    'Thu-AM': false, 'Thu-PM': true,
    'Fri-AM': true, 'Fri-PM': true,
    'Sat-AM': false, 'Sat-PM': false,
    'Sun-AM': false, 'Sun-PM': false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session) return;
      const data = await offlineGet<{ profile: any }>(
        "/api/v1/artisan/settings",
        session.access_token
      );
      if (data?.profile) {
        if (data.profile.accepts_emergency !== undefined) setEmergencyEnabled(data.profile.accepts_emergency);
        if (data.profile.accepts_standard !== undefined) setStandardEnabled(data.profile.accepts_standard);
        if (data.profile.availability_schedule) setAvailability(data.profile.availability_schedule);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const { offline } = await offlinePost(
      "/api/v1/artisan/availability",
      "PUT",
      { accepts_emergency: emergencyEnabled, accepts_standard: standardEnabled, availability_schedule: availability },
      session?.access_token || ""
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (offline) console.log('Saved offline — will sync when back online');
  };

  const toggleSlot = (day: string, time: string) => {
    const key = `${day}-${time}`;
    setAvailability(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Service & Availability</h1>
          <p className="text-gray-500 mt-1">Manage your operational hours and dispatch readiness.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm self-start md:self-auto">
          <CalendarIcon className="w-4 h-4 text-green-600" />
          <div>
            <div className="text-[10px] text-gray-500 leading-tight uppercase font-bold tracking-wider">Next Available Slot</div>
            <div className="text-sm font-bold text-gray-900 leading-tight">Today, 2:00 PM</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border-2 transition-colors flex items-center justify-between cursor-pointer ${emergencyEnabled ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`} onClick={() => setEmergencyEnabled(!emergencyEnabled)}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${emergencyEnabled ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${emergencyEnabled ? 'text-red-900' : 'text-gray-900'}`}>Emergency Dispatch</h3>
              <p className={`text-sm ${emergencyEnabled ? 'text-red-700' : 'text-gray-500'}`}>
                {emergencyEnabled ? 'Available for immediate deployment.' : 'Currently unavailable.'}
              </p>
            </div>
          </div>
          {/* Custom Toggle */}
          <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${emergencyEnabled ? 'bg-red-600 justify-end' : 'bg-gray-300 justify-start'}`}>
            <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
        </div>

        <div className={`p-6 rounded-2xl border-2 transition-colors flex items-center justify-between cursor-pointer ${standardEnabled ? 'bg-white border-green-200' : 'bg-white border-gray-200'}`} onClick={() => setStandardEnabled(!standardEnabled)}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${standardEnabled ? 'bg-[#003849] text-white' : 'bg-gray-100 text-gray-400'}`}>
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Standard Bookings</h3>
              <p className="text-sm text-gray-500">
                {standardEnabled ? 'Accepting regular service requests.' : 'Not accepting new requests.'}
              </p>
            </div>
          </div>
          {/* Custom Toggle */}
          <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${standardEnabled ? 'bg-green-600 justify-end' : 'bg-gray-300 justify-start'}`}>
            <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-gray-900 text-lg">Weekly Availability</h3>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-3 h-3 rounded-sm bg-[#003849]" /> Available
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-3 h-3 rounded-sm bg-gray-200" /> Unavailable
            </div>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-8 gap-4 mb-4">
              <div className="col-span-1"></div>
              {days.map(day => (
                <div key={day} className="col-span-1 text-center font-bold text-sm text-gray-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-8 gap-4 mb-4 items-center">
              <div className="col-span-1 text-right pr-4">
                <div className="font-bold text-gray-900 text-sm">AM Block</div>
                <div className="text-xs text-gray-500">8:00 - 12:00</div>
              </div>
              {days.map(day => {
                const isAvail = availability[`${day}-AM`];
                return (
                  <button 
                    key={`${day}-AM`}
                    onClick={() => toggleSlot(day, 'AM')}
                    className={`col-span-1 h-16 rounded-xl flex items-center justify-center transition-all ${
                      isAvail ? 'bg-[#003849] text-white shadow-md' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {isAvail ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><path d="M5 12l5 5L20 7"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-8 gap-4 items-center">
              <div className="col-span-1 text-right pr-4">
                <div className="font-bold text-gray-900 text-sm">PM Block</div>
                <div className="text-xs text-gray-500">13:00 - 17:00</div>
              </div>
              {days.map(day => {
                const isAvail = availability[`${day}-PM`];
                return (
                  <button 
                    key={`${day}-PM`}
                    onClick={() => toggleSlot(day, 'PM')}
                    className={`col-span-1 h-16 rounded-xl flex items-center justify-center transition-all ${
                      isAvail ? 'bg-[#003849] text-white shadow-md' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {isAvail ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><path d="M5 12l5 5L20 7"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3 text-blue-800">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm">Timezone Notice</h4>
          <p className="text-sm mt-1 opacity-80">
            All schedules are displayed in your local timezone. Emergency dispatch availability supersedes standard blocks.
          </p>
        </div>
      </div>
      
      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-3">
          <span className="text-xs text-gray-400">Changes sync when back online if offline.</span>
          <div className="flex gap-3">
            <button onClick={() => navigate('/artisan/settings')} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
            <button
              disabled={saving}
              onClick={handleSave}
              className={`px-6 py-2.5 font-bold rounded-lg transition-all flex items-center gap-2 text-sm ${
                saved ? 'bg-green-600 text-white' : 'bg-[#001f29] hover:bg-black text-white'
              }`}
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> :
               saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
