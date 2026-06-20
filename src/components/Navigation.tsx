import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-surface-dim h-16 flex items-center justify-between px-space-6 lg:px-space-12">
      <div className="flex items-center gap-space-8">
        <h1 className="text-xl font-bold text-primary tracking-tight">Triid</h1>
        <div className="hidden md:flex items-center gap-space-6 text-sm font-medium text-on-surface-variant">
          <a href="#emergency" className="hover:text-primary transition-colors text-primary border-b-2 border-primary h-16 flex items-center">Emergency</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors h-16 flex items-center">How it Works</a>
          <a href="#community" className="hover:text-primary transition-colors h-16 flex items-center">Community</a>
        </div>
      </div>
      <div className="flex items-center gap-space-4">
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <Link to="/auth" className="bg-primary text-white border border-primary px-space-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-container hover:text-white transition-colors">
          Get Started
        </Link>
      </div>
    </nav>
  );
}
