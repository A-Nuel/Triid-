import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase } from 'lucide-react';

export function Splash() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-white font-sans selection:bg-white/20 relative">
      <div className="flex flex-col items-center z-10 w-full max-w-sm px-6 text-center">
        
        {/* Animated Rings & Icon */}
        <div className="relative mb-space-6 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-24 h-24 border border-white/10 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute w-32 h-32 border border-white/5 rounded-full"
          />
          <div className="absolute w-20 h-20 bg-primary-container/40 rounded-full blur-xl" />
          
          <div className="relative w-16 h-16 bg-[#1b4f63] border border-[#2f6b80] rounded-xl flex items-center justify-center transform rotate-45">
            <Briefcase className="w-6 h-6 text-white transform -rotate-45" />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-space-3">Triid</h1>
        <p className="text-sm text-primary-fixed-dim leading-relaxed font-medium">
          Trusted artisans. Fast dispatch.<br />Every time.
        </p>

      </div>
      
      {/* Loading Dots at bottom */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-white/80"
          />
        ))}
      </div>
    </div>
  );
}
