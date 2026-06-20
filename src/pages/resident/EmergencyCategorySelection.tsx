import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Wrench, Lightbulb, Shield, HelpCircle, Key, Car, X } from "lucide-react";
import { cn } from "@/lib/utils";

const EMERGENCY_CATEGORIES = [
  { id: "electrical", name: "Electrical Output", icon: Lightbulb, color: "bg-orange-100 text-orange-600" },
  { id: "plumbing", name: "Burst Pipe", icon: Wrench, color: "bg-blue-100 text-blue-600" },
  { id: "generator", name: "Generator Failure", icon: Zap, color: "bg-yellow-100 text-yellow-600" },
  { id: "security", name: "Security Issue", icon: Shield, color: "bg-red-100 text-red-600" },
  { id: "locksmith", name: "Lockout", icon: Key, color: "bg-slate-100 text-slate-600" },
  { id: "vehicle", name: "Vehicle Dead", icon: Car, color: "bg-stone-100 text-stone-600" },
  { id: "other", name: "Other Emergency", icon: HelpCircle, color: "bg-gray-100 text-gray-600" },
];

export function EmergencyCategorySelection() {
  const navigate = useNavigate();

  const handleSelectCategory = (categoryId: string) => {
    navigate(`/resident/emergency/describe?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">What's the emergency?</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <p className="text-gray-500 mb-6 font-medium">Select the category that best describes your issue. We'll find someone nearby to help.</p>
        
        <div className="grid grid-cols-2 gap-4">
          {EMERGENCY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col items-center text-center gap-4 active:scale-[0.98]"
            >
              <div className={cn("p-4 rounded-full", cat.color)}>
                <cat.icon className="w-8 h-8" />
              </div>
              <span className="font-semibold text-gray-900">{cat.name}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
