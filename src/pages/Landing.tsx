import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { HeroSlider } from '@/components/HeroSlider';
import { Workflow } from '@/components/Workflow';
import { EmergencySupport } from '@/components/EmergencySupport';
import { TrustNetwork } from '@/components/TrustNetwork';
import { Testimonials } from '@/components/Testimonials';
import { CTA, Footer } from '@/components/CTA';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const role = user.user_metadata?.role;
      if (role === 'resident') {
        navigate('/resident/dashboard', { replace: true });
      } else if (role === 'artisan') {
        navigate('/artisan/dashboard', { replace: true });
      } else {
        navigate('/onboarding/role', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return null; // Or a simple spinner if preferred, but null prevents flash before redirect
  }

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
