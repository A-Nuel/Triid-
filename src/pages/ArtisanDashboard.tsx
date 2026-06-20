import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ArtisanDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-space-12 rounded-xl shadow-sm border border-surface-variant text-center">
        <h1 className="text-3xl font-bold text-primary mb-space-4">Artisan Dashboard</h1>
        <p className="text-on-surface-variant mb-space-8">Welcome back. Manage your jobs, escrow payments, and availability schedule here.</p>
        
        <button 
          onClick={handleSignOut}
          className="bg-primary text-white px-space-6 py-2 rounded-md font-semibold text-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
