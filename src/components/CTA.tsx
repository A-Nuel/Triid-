import { useNavigate } from 'react-router-dom';

export function CTA() {
  const navigate = useNavigate();
  return (
    <section className="py-space-16 px-space-6 md:px-space-12 bg-white">
      <div className="max-w-6xl mx-auto bg-[#1b4f63] rounded-[16px] p-space-8 md:p-space-12 lg:p-space-16 text-center overflow-hidden relative shadow-xl shadow-primary-container/20 border border-primary">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-primary-fixed-dim/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-80 h-80 rounded-full bg-tertiary-fixed-dim/10 blur-3xl" />
        
        <h2 className="relative z-10 text-4xl md:text-5xl font-bold text-white tracking-tight mb-space-12 max-w-2xl mx-auto leading-tight">
          Ready for a Secure Repair Experience?
        </h2>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-space-6 max-w-3xl mx-auto">
          {/* Resident CTA */}
          <div className="bg-[#143b4f] border border-[#2f6b80] rounded-xl p-space-8 text-left transition-transform hover:-translate-y-1 duration-300">
            <h3 className="text-xl font-bold text-white mb-space-2">Need a Hand?</h3>
            <p className="text-sm text-[#9dcde5] mb-space-8 h-10">
              Join thousands of residents using Triid for their daily and emergency needs.
            </p>
            <button onClick={() => navigate('/auth')} className="w-full bg-white text-primary py-3 rounded-md font-bold text-sm hover:bg-surface-bright transition-colors">
              Sign Up as Resident
            </button>
          </div>
          
          {/* Artisan CTA */}
          <div className="bg-[#143b4f] border border-[#2f6b80] rounded-xl p-space-8 text-left transition-transform hover:-translate-y-1 duration-300">
            <h3 className="text-xl font-bold text-white mb-space-2">Are you an Artisan?</h3>
            <p className="text-sm text-[#9dcde5] mb-space-8 h-10">
              Get more high-quality leads and guaranteed payments for your skilled work.
            </p>
            <button onClick={() => navigate('/auth')} className="w-full bg-[#9dcde5] text-primary py-3 rounded-md font-bold text-sm hover:bg-white transition-colors">
              Join as an Artisan
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-surface-variant pt-space-8 pb-space-8 px-space-6 md:px-space-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[12px] text-on-surface-variant">
        <p>&copy; 2026 Triid. Secure. Stable. Artisan-Powered.</p>
        <p className="mt-2 md:mt-0 font-medium">Redemption City Pilot</p>
      </div>
    </footer>
  );
}
