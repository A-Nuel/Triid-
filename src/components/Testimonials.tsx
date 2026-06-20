import { UserCircle2, CheckCircle, Shield, Lock, HeadphonesIcon } from 'lucide-react';

export function Testimonials() {
  const protocols = [
    { icon: <CheckCircle className="w-8 h-8 text-primary" />, title: "100% Verified", desc: "KYC & Skill Audited" },
    { icon: <Shield className="w-8 h-8 text-primary" />, title: "Fully Insured", desc: "Liability Coverage" },
    { icon: <Lock className="w-8 h-8 text-primary" />, title: "Escrow Pay", desc: "Secure Fund Locking" },
    { icon: <HeadphonesIcon className="w-8 h-8 text-primary" />, title: "24/7 Support", desc: "Human Intervention" },
  ];

  return (
    <section className="py-space-16 px-space-6 md:px-space-12 bg-white border-t border-surface-variant">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-space-12 items-center">
        
        {/* Left Side: Testimonials */}
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold text-primary mb-space-8 tracking-tight">Vouched by Redemption City</h2>
          
          <div className="space-y-space-8">
            <div className="relative">
              <p className="text-on-surface-variant italic leading-relaxed mb-space-4">
                "When our estate generator failed at 11 PM, Triid had a technician here in 20 minutes. The escrow payment meant I didn't have to worry about cash or quality—it was all handled through the app."
              </p>
              <div className="flex items-center gap-space-3">
                <UserCircle2 className="w-10 h-10 text-on-surface-variant" />
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Mrs. Funke Balogun</h4>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Resident, Victory Estate</p>
                </div>
              </div>
            </div>
            
            <div className="relative pl-space-4 border-l-2 border-surface-dim">
              <p className="text-on-surface-variant italic leading-relaxed mb-space-4">
                "Joining Triid as an artisan changed my business. I no longer chase customers for payment. Once the job is confirmed, the money is there. It brings a lot of stability."
              </p>
              <div className="flex items-center gap-space-3">
                <img 
                  src="https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?q=80&w=150&auto=format&fit=crop" 
                  alt="Artisan" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Mr. Emeka Nnadi</h4>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Artisan, 5 Years on Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Trust & Safety */}
        <div className="bg-surface rounded-xl p-space-8 md:p-space-10">
          <h3 className="text-2xl font-bold text-center text-primary mb-space-8">Safety Protocol Compliance</h3>
          <div className="grid grid-cols-2 gap-y-space-10 gap-x-space-6 text-center">
            {protocols.map((proto, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="mb-space-3 p-3 bg-white rounded-lg shadow-sm border border-surface-variant">
                  {proto.icon}
                </div>
                <h4 className="font-bold text-sm text-on-surface mb-1">{proto.title}</h4>
                <p className="text-[11px] text-on-surface-variant">{proto.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
