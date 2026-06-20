import { Network, Handshake, TrendingDown } from 'lucide-react';

export function TrustNetwork() {
  const features = [
    {
      icon: <Network className="w-8 h-8 text-primary" />,
      title: "Community Vouching Ledger",
      description: "Artisans are vetted by the community. Our unique vouching graph ensures that only trusted professionals handle your emergencies."
    },
    {
      icon: <TrendingDown className="w-8 h-8 text-primary" />,
      title: "Zero Surge Pricing",
      description: "AI-suggested fair pricing corridors based on historical data. No unexpected 300% markups during peak emergencies."
    },
    {
      icon: <Handshake className="w-8 h-8 text-primary" />,
      title: "Guaranteed Payouts",
      description: "For artisans, funds are locked in escrow before you dispatch. Focus on the repair, not on chasing invoices."
    }
  ];

  return (
    <section id="community" className="py-space-16 px-space-6 md:px-space-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-space-12">
          <h2 className="text-3xl font-bold text-primary mb-space-4 tracking-tight">Built on a Network of Trust</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            Traditional marketplaces rely on anonymous reviews. Triid uses a transparent ledger of community vouches and escrow contracts to protect both residents and artisans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-8">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-surface-bright border border-surface-variant rounded-xl p-space-8 hover:shadow-md transition-all hover:border-primary-container/30">
              <div className="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center mb-space-6 text-primary">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-space-3">{feat.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
