import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SecuritySettings } from '@/components/SecuritySettings';

export function SettingsSecurity() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="px-6 py-4 flex items-center gap-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/artisan/settings')} 
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Security Settings</h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <SecuritySettings />
      </main>
    </div>
  );
}
