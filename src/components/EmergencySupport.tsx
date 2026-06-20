import { Zap, Droplet, Cog, Car, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EmergencySupport() {
  const navigate = useNavigate();
  const categories = [
    { icon: <Zap className="w-7 h-7 text-critical" />, name: "Electrical", desc: "Short circuits, outages, and panel fires." },
    { icon: <Droplet className="w-7 h-7 text-critical" />, name: "Plumbing", desc: "Burst pipes, major leaks, and sewer backups." },
    { icon: <Cog className="w-7 h-7 text-critical" />, name: "Generator", desc: "Mechanical failure and fuel system repairs." },
    { icon: <Car className="w-7 h-7 text-critical" />, name: "Vehicle", desc: "Roadside assistance and engine recovery." }
  ];

  return (
    <section id="emergency" className="py-space-16 px-space-6 md:px-space-12 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-space-10">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-space-2 tracking-tight">Emergency Support</h2>
            <p className="text-on-surface-variant">Rapid response for life's unpredictable moments.</p>
          </div>
          <button 
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-container mt-4 md:mt-0 transition-colors"
          >
            View All Emergencies <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4">
          {categories.map((cat, idx) => (
            <div 
              key={idx} 
              className="bg-white border text-left border-surface-variant rounded-xl p-space-6 hover:shadow-md transition-all group hover:border-critical/30 cursor-pointer border-l-[3px] border-l-transparent hover:border-l-critical"
            >
              <div className="mb-space-4 p-3 bg-critical-bg inline-block rounded-md">
                {cat.icon}
              </div>
              <h3 className="font-bold text-lg text-on-surface mb-1">{cat.name}</h3>
              <p className="text-sm text-on-surface-variant">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
