import { FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function Workflow() {
  const steps = [
    {
      icon: <FileText className="w-7 h-7 text-primary" />,
      title: "1. Report",
      description: "Post your requirement or emergency. Our system instantly matches you with the best-vetted artisans in Redemption City.",
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-primary" />,
      title: "2. Secure",
      description: "Funds are held in Triid Escrow. Work begins only when the contract is locked, protecting both you and the artisan.",
    },
    {
      icon: <CheckCircle2 className="w-7 h-7 text-primary" />,
      title: "3. Confirm",
      description: "Inspect the work. Once you are 100% satisfied, confirm completion and the funds are released to the artisan.",
    }
  ];

  return (
    <section id="how-it-works" className="py-space-16 px-space-6 md:px-space-12 bg-white text-center">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-space-2 tracking-tight">Escrow-Protected Workflow</h2>
        <p className="text-on-surface-variant max-w-2xl mx-auto mb-space-12">
          Our tri-party system ensures that every job is completed to perfection before funds are released. Your security is our primary utility.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
          {steps.map((step, idx) => (
            <div key={idx} className="border border-surface-variant rounded-xl p-space-8 text-center hover:shadow-sm transition-all duration-300 hover:border-outline-variant bg-surface-bright">
              <div className="w-14 h-14 rounded-full bg-surface shadow-sm border border-surface-variant flex items-center justify-center mx-auto mb-space-5">
                {step.icon}
              </div>
              <h3 className="text-[17px] font-bold text-on-surface mb-space-2">{step.title}</h3>
              <p className="text-sm text-on-surface-variant text-balance leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
