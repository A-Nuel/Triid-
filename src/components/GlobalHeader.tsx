import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function GlobalHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.user_metadata?.role || 'resident';

  const handleHome = () => {
    navigate(role === 'artisan' ? '/artisan/dashboard' : '/resident/dashboard');
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      handleHome();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <button 
          onClick={handleBack}
          className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors flex items-center gap-2 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button 
          onClick={handleHome}
          className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors flex items-center gap-2 font-semibold text-sm"
        >
          <Home className="w-4 h-4" /> Home
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="font-bold text-[#1b4f63] hidden sm:block tracking-tight text-lg">Triid</span>
        <div className="w-8 h-8 flex items-center justify-center bg-[#1b4f63] text-white rounded-lg font-bold text-sm shadow-inner">
          T
        </div>
      </div>
    </header>
  );
}
