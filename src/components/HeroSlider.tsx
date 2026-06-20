import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    id: 'emergency',
    tag: 'URGENT RESPONSE',
    tagStyle: 'bg-critical text-white',
    title: 'Emergency Repairs.',
    description: 'Immediate dispatch for critical failures. Verified artisans ready 24/7 in Redemption City.',
    cta: 'Get Help Now',
    ctaStyle: 'bg-critical hover:bg-red-800 text-white',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop',
    overlay: 'from-black/95 via-black/60 to-transparent'
  },
  {
    id: 'marketplace',
    tag: 'COMMUNITY MARKETPLACE',
    tagStyle: 'bg-primary-container text-primary-fixed',
    title: 'Local Artisans.',
    description: 'Discover top-rated professionals for your home projects. Quality guaranteed by the Triid ecosystem.',
    cta: 'Browse Artisans',
    ctaStyle: 'bg-white text-primary hover:bg-gray-100',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop',
    overlay: 'from-primary/95 via-primary/70 to-transparent'
  }
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[85vh] overflow-hidden bg-neutral-900 mt-16">
      <AnimatePresence mode="wait">
        <motion.div
  key={current}
  initial={{ opacity: 0, scale: 1.05 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="absolute inset-0"
>
  <div 
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: `url(${slides[current].image})` }}
  />
  <div className={`absolute inset-0 bg-gradient-to-r md:w-3/4 lg:w-2/3 ${slides[current].overlay}`} />
  
  <div className="relative h-full flex items-center px-space-6 md:px-space-12 max-w-7xl mx-auto w-full">
    <div className="max-w-xl text-white">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`inline-block px-2 py-1 rounded-sm text-[11px] font-bold tracking-[1.5px] mb-space-4 border border-white/20 ${slides[current].tagStyle}`}
      >
        {slides[current].tag}
      </motion.div>
      <motion.h2 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-4xl md:text-6xl lg:text-[72px] font-bold tracking-tight mb-space-4 leading-[1.1]"
      >
        {slides[current].title}
      </motion.h2>
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg md:text-xl text-gray-200 mb-space-8 max-w-md font-medium"
      >
        {slides[current].description}
      </motion.p>
      <motion.button 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => navigate('/auth')}
        className={`px-space-6 py-4 rounded-md font-semibold flex items-center gap-2 transition-all shadow-lg ${slides[current].ctaStyle}`}
      >
        {slides[current].cta}
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  </div>
</motion.div>
      </AnimatePresence>
      
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-space-2 z-20">
        {slides.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${current === idx ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
