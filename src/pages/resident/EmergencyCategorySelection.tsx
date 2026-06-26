import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Wrench, Shield, Car, AlertTriangle, Key, MoreHorizontal, Fan } from "lucide-react";
import { cn } from "@/lib/utils";

const EMERGENCY_CATEGORIES = [
  { id: "electrical", name: "Electrical", icon: Zap },
  { id: "plumbing", name: "Plumbing", icon: Wrench },
  { id: "generator", name: "Generator", icon: Zap }, // Using zap for generator as per original
  { id: "vehicle", name: "Vehicle", icon: Car },
  { id: "security", name: "Security", icon: Shield },
  { id: "hvac", name: "HVAC", icon: Fan },
  { id: "locksmith", name: "Locksmith", icon: Key },
  { id: "other", name: "Other", icon: MoreHorizontal },
];

export function EmergencyCategorySelection() {
  const navigate = useNavigate();

  const handleSelectCategory = (categoryId: string) => {
    navigate(`/resident/emergency/describe?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <header className="px-6 py-5 flex items-center justify-between relative">
        <button onClick={() => navigate('/resident/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-gray-200/50 text-[#001f29] transition-colors z-10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Logo placeholder matching design (Tn.) */}
          <span className="font-bold text-[#001f29] tracking-tight text-lg">Tn.</span>
        </div>
        <div className="w-9" /> {/* Spacer for flex balance */}
      </header>

      <main className="flex-1 px-6 pt-6 pb-12 flex flex-col items-center max-w-4xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl font-bold text-[#b91c1c] mb-3">What's the emergency?</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Select the service that best describes your current critical situation. A dispatcher will be notified immediately.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
          {EMERGENCY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className="bg-white pt-6 pb-5 px-4 rounded-xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col items-center text-center gap-3 active:scale-[0.98] relative overflow-hidden group"
            >
              {/* Red top border line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#b91c1c]"></div>
              
              <div className="text-[#b91c1c] transition-transform group-hover:scale-110">
                <cat.icon className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[#001f29] text-sm">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-xl p-5 flex items-start gap-3 w-full max-w-2xl shadow-sm">
          <AlertTriangle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" strokeWidth={2.5} />
          <div className="text-left">
            <h4 className="text-[#b91c1c] font-bold text-sm mb-1">If this is a life-threatening emergency</h4>
            <p className="text-[#991b1b] text-xs leading-relaxed font-medium">
              Please exit this application and dial 911 or your local emergency services immediately.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
