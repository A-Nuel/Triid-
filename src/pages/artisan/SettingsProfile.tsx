import { useState, useEffect, useRef } from "react";
import { ImagePlus, X, Loader2, CheckCircle2, ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const CACHE_KEY = (uid: string) => `triid_profile_settings_${uid}`;

const SKILL_OPTIONS = [
  'electrical', 'plumbing', 'generator', 'hvac',
  'locksmith', 'vehicle', 'security', 'cleaning', 'other'
];

export function SettingsProfile() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bio, setBio] = useState("");
  const [fullName, setFullName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      // 1. Show cache immediately (offline-first)
      if (user) {
        const cached = localStorage.getItem(CACHE_KEY(user.id));
        if (cached) {
          try {
            const c = JSON.parse(cached);
            setFullName(c.fullName || "");
            setPhotoUrl(c.photoUrl || "");
            setBio(c.bio || "");
            setSkills(c.skills || []);
            setMinPrice(c.minPrice || "");
            setMaxPrice(c.maxPrice || "");
            setPortfolio(c.portfolio || []);
            setLoading(false);
          } catch {}
        }
      }

      // 2. Fetch fresh from API
      try {
        const res = await fetch("/api/v1/artisan/settings", {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });
        if (res.ok) {
          const { profile, user: u } = await res.json();
          const fn = u?.user_metadata?.full_name || "";
          const pu = u?.user_metadata?.avatar_url || "";
          const b = profile?.bio || "";
          const sk = profile?.skill_categories || [];
          const mn = profile?.starting_price_min?.toString() || "";
          const mx = profile?.starting_price_max?.toString() || "";
          const pf = profile?.portfolio_images || [];

          setFullName(fn);
          setPhotoUrl(pu);
          setBio(b);
          setSkills(sk);
          setMinPrice(mn);
          setMaxPrice(mx);
          setPortfolio(pf);

          // Save to cache
          if (user) {
            localStorage.setItem(CACHE_KEY(user.id), JSON.stringify({
              fullName: fn, photoUrl: pu, bio: b, skills: sk,
              minPrice: mn, maxPrice: mx, portfolio: pf
            }));
          }
        }
      } catch (err) {
        console.warn("Network error — using cached data", err);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchSettings();
  }, [session, user]);

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Upload image to Supabase Storage
  const handleImageUpload = async (file: File, replaceIdx?: number) => {
    if (!user) return;
    if (portfolio.length >= 6 && replaceIdx === undefined) {
      setError("Maximum 6 photos allowed");
      return;
    }

    const uploadSlot = replaceIdx ?? portfolio.length;
    setUploadingIdx(uploadSlot);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed. Server responded with " + res.status);
      }

      const data = await res.json();
      const publicUrl = data.url;

      const updated = [...portfolio];
      if (replaceIdx !== undefined) {
        updated[replaceIdx] = publicUrl;
      } else {
        updated.push(publicUrl);
      }
      setPortfolio(updated);
    } catch (err: any) {
      console.error("Upload error", err);
      setError(err.message || "Failed to upload image. Please try again later.");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload avatar");
      const data = await res.json();
      setPhotoUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      full_name: fullName,
      avatar_url: photoUrl,
      bio,
      skill_categories: skills,
      starting_price_min: Number(minPrice) || 0,
      starting_price_max: Number(maxPrice) || 0,
      portfolio_images: portfolio
    };

    // Optimistic cache update immediately
    if (user) {
      localStorage.setItem(CACHE_KEY(user.id), JSON.stringify({
        fullName, photoUrl, bio, skills, minPrice, maxPrice, portfolio
      }));
    }

    try {
      const res = await fetch("/api/v1/artisan/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        let msg = "Failed to save profile";
        try { msg = (await res.json()).error?.message || msg; } catch {}
        setError(msg);
      }
    } catch {
      // Offline — queue save for later
      const pending = JSON.parse(localStorage.getItem('triid_pending_saves') || '[]');
      pending.push({ endpoint: '/api/v1/artisan/profile', method: 'PUT', body: payload, ts: Date.now() });
      localStorage.setItem('triid_pending_saves', JSON.stringify(pending));
      setSaved(true); // Optimistically mark saved
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !fullName) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/artisan/settings')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Profile & Portfolio</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Manage your professional identity and showcase your work.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Avatar Upload Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center w-full lg:w-72 flex-shrink-0 shadow-sm">
          <div className="w-32 h-32 rounded-full bg-[#f0f4f8] flex items-center justify-center text-gray-400 mb-6 border-4 border-white shadow-md overflow-hidden relative">
            {uploadingAvatar ? (
              <Loader2 className="w-8 h-8 animate-spin text-[#1b4f63]" />
            ) : photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="text-3xl font-bold text-[#1b4f63] uppercase">
                {fullName?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={avatarInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <button 
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="bg-[#eef2f6] hover:bg-[#e1eaef] text-[#1b4f63] font-bold py-2 px-6 rounded-lg text-sm transition-colors mb-3 flex items-center gap-2"
          >
            {uploadingAvatar ? "Uploading..." : <><Upload className="w-4 h-4" /> Change Photo</>}
          </button>
          <p className="text-xs text-gray-400 font-medium">JPG, GIF or PNG. Max size of 800K</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-8 flex-1">

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
                  placeholder="e.g. Emeka Okafor"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
                />
              </div>
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="block text-sm font-bold text-gray-700">Bio</label>
                  <span className="text-xs text-gray-400">{bio.length}/300</span>
                </div>
                <textarea
                  rows={4}
                  value={bio}
                maxLength={300}
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
            {SKILL_OPTIONS.map(skill => {
              const selected = skills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border capitalize transition-all ${
                    selected
                      ? 'bg-[#003849] text-white border-[#003849] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#003849] hover:text-[#003849]'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          {skills.length === 0 && (
            <p className="text-sm text-amber-600 mt-2 font-medium">Select at least one skill to appear in search results.</p>
          )}
        </div>

        {/* Pricing */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Starting Pricing Range</h3>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="font-bold text-gray-900 min-w-[80px] text-sm">Per Service</div>
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₦</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
                  placeholder="Min"
                />
              </div>
              <span className="text-gray-400 font-bold">—</span>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₦</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1b4f63] focus:border-[#1b4f63] outline-none transition-all"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Gallery — Direct Upload */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex justify-between items-baseline mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Portfolio Gallery</h3>
              <p className="text-sm text-gray-500 mt-0.5">Upload photos of your past work to build trust with residents.</p>
            </div>
            <span className="text-xs text-gray-500 font-medium">{portfolio.length}/6 photos</span>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Upload button */}
            {portfolio.length < 6 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingIdx !== null}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-[#1b4f63] hover:text-[#1b4f63] transition-all gap-2 group disabled:opacity-50"
              >
                {uploadingIdx === portfolio.length ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold">Upload Photo</span>
                    <span className="text-[10px] text-gray-400">JPG, PNG, WebP</span>
                  </>
                )}
              </button>
            )}

            {/* Existing images */}
            {portfolio.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden relative group shadow-sm">
                {uploadingIdx === i ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1b4f63]" />
                  </div>
                ) : (
                  <img src={img} alt={`Work sample ${i + 1}`} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => removePortfolioImage(i)}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty placeholders */}
            {portfolio.length < 6 && [...Array(Math.max(0, 5 - portfolio.length))].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-200"
              >
                <ImagePlus className="w-8 h-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-3">
          <span className="text-xs text-gray-400">Changes are saved to your profile and cached offline.</span>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/artisan/settings')}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className={`px-6 py-2.5 font-bold rounded-lg transition-all flex items-center gap-2 text-sm ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-[#001f29] hover:bg-black text-white'
              }`}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
