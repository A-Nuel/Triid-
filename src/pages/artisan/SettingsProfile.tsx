import { useState, useEffect } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SettingsProfile() {
  const { session } = useAuth();
  const [skills, setSkills] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bio, setBio] = useState("");
  const [fullName, setFullName] = useState("");
  const [portfolio, setPortfolio] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/v1/artisan/settings", {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });
        if (res.ok) {
          const { profile, user } = await res.json();
          setFullName(user.user_metadata?.full_name || "");
          setBio(profile.bio || "");
          setSkills(profile.skill_categories || []);
          setMinPrice(profile.starting_price_min?.toString() || "");
          setMaxPrice(profile.starting_price_max?.toString() || "");
          setPortfolio(profile.portfolio_images || []);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchSettings();
  }, [session]);

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/artisan/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({
          full_name: fullName,
          bio,
          skill_categories: skills,
          starting_price_min: Number(minPrice),
          starting_price_max: Number(maxPrice),
          portfolio_images: portfolio
        })
      });
      if (res.ok) {
        alert("Profile saved successfully");
      } else {
        const error = await res.json();
        alert(error.error?.message || "Failed to save profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-32">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Profile & Portfolio</h1>
        <p className="text-gray-500 mt-1">Manage your professional identity and showcase your best work.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-8">
        
        {/* Professional Identity */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Identity</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="block text-sm font-bold text-gray-700">Bio</label>
                <span className="text-xs text-gray-400">{bio.length}/160</span>
              </div>
              <textarea 
                rows={4}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Briefly describe your expertise and experience..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Skill Categories */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Skill Categories</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <div key={skill} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border ${skill === 'Electrical' ? 'bg-[#003849] text-white border-[#003849]' : 'bg-white text-gray-700 border-gray-300'}`}>
                {skill}
                <button onClick={() => removeSkill(skill)} className="p-0.5 hover:bg-black/10 rounded-full transition-colors ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button 
              onClick={() => {
                const s = prompt("Enter a new skill category");
                if (s && !skills.includes(s)) setSkills([...skills, s]);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              + Add Skill
            </button>
          </div>
        </div>

        {/* Pricing Range */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Starting Pricing Range</h3>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="font-bold text-gray-900 min-w-[100px]">Service</div>
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₦</span>
                <input 
                  type="number" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
                  placeholder="Min"
                />
              </div>
              <span className="text-gray-400 font-bold">-</span>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₦</span>
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Gallery */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-lg font-bold text-gray-900">Portfolio Gallery</h3>
            <span className="text-xs text-gray-500 font-medium">{portfolio.length}/6 photos</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button 
              onClick={() => {
                if (portfolio.length >= 6) return alert("Maximum 6 photos allowed");
                const url = prompt("Enter image URL");
                if (url) setPortfolio([...portfolio, url]);
              }}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all gap-2 group"
            >
              <ImagePlus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">Add Photo</span>
            </button>
            {portfolio.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden relative group">
                <img src={img} alt="Work sample" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => setPortfolio(portfolio.filter((_, idx) => idx !== i))} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {[...Array(Math.max(0, 5 - portfolio.length))].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                <ImagePlus className="w-10 h-10 opacity-30" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <button className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#001f29] hover:bg-black text-white font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
