import { Navigation } from '@/components/Navigation';
import { HeroSlider } from '@/components/HeroSlider';
import { Workflow } from '@/components/Workflow';
import { EmergencySupport } from '@/components/EmergencySupport';
import { TrustNetwork } from '@/components/TrustNetwork';
import { Testimonials } from '@/components/Testimonials';
import { CTA, Footer } from '@/components/CTA';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-on-background selection:bg-primary/20 selection:text-primary">
      <Navigation />
      
      <main className="flex-grow">
        <HeroSlider />
        <Workflow />
        <EmergencySupport />
        <TrustNetwork />
        <Testimonials />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
