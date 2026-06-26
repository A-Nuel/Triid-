import { useNavigate } from "react-router-dom";
import { User, ShieldCheck, Calendar, Lock, ArrowRight, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function SettingsHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      // Check cache first (offline-first)
      const cached = localStorage.getItem(`triid_settings_hub_${user.id}`);
      if (cached) {
        try { setProfile(JSON.parse(cached)); } catch {}
      }
      try {
        const { data } = await supabase
          .from("users")
          .select(`
            full_name,
            artisan_profiles (
              skill_categories,
              average_rating,
              total_reviews,
              verification_status
            )
          `)
          .eq("id", user.id)
          .single();
        if (data) {
          setProfile(data);
          localStorage.setItem(`triid_settings_hub_${user.id}`, JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Network error, using cached data', err);
      }
    }
    loadProfile();
  }, [user]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Artisan Profile</h1>
          <p className="text-gray-500 mt-1">Manage your presence, availability, and security on Triid.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm self-start md:self-auto">
          <Eye className="w-4 h-4" /> View as Resident
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#1b4f63] text-white flex items-center justify-center text-3xl font-bold uppercase shadow-inner">
            {profile?.full_name?.charAt(0) || "A"}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || "Loading..."}</h2>
            <span className="px-3 py-0.5 bg-[#1b4f63] text-white text-xs font-semibold rounded-full w-max mx-auto md:mx-0">
              {profile?.artisan_profiles?.skill_categories?.[0] || "Artisan"}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Joined {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
          
          <div className="flex items-center justify-center md:justify-start gap-8 mt-4">
            <div>
              <div className="text-lg font-bold text-gray-900 flex items-center gap-1">
                {profile?.artisan_profiles?.average_rating || "New"}
              </div>
              <div className="text-xs text-gray-500">Rating ({profile?.artisan_profiles?.total_reviews || 0}+)</div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div>
              <div className="text-lg font-bold text-gray-900">98%</div>
              <div className="text-xs text-gray-500">Completion</div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div>
              <div className="text-lg font-bold text-green-600">Active</div>
              <div className="text-xs text-gray-500">Status</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile & Portfolio */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-6 right-6 px-2 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-md">
            Portfolio: 80% Complete
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Public Profile & Portfolio</h3>
          <p className="text-gray-500 text-sm mt-2 flex-1">Update your bio, service descriptions, and showcase your past projects to attract residents.</p>
          <button 
            onClick={() => navigate('/artisan/settings/profile')}
            className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
          >
            Manage Profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Identity & Verification */}
        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-green-500 border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-6 right-6 flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
            <ShieldCheck className="w-3 h-3" /> Verified
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Identity & Verification</h3>
          <p className="text-gray-500 text-sm mt-2 flex-1">Manage your government ID, background check status, and professional licenses.</p>
          <button 
            onClick={() => navigate('/artisan/settings/verification')}
            className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
          >
            View Documents <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Service Availability */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-6 right-6 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md">
            Standard Hours
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Service Availability</h3>
          <p className="text-gray-500 text-sm mt-2 flex-1">Set your working hours, coverage areas, and emergency dispatch preferences.</p>
          <button 
            onClick={() => navigate('/artisan/settings/availability')}
            className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
          >
            Set Schedule <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Account Security */}
        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-gray-300 border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-6 right-6 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
            2FA Enabled
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Account Security</h3>
          <p className="text-gray-500 text-sm mt-2 flex-1">Update your password, manage two-factor authentication, and review login activity.</p>
          <button 
            className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
          >
            Security Settings <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
