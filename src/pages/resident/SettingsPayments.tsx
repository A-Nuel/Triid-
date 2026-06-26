import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Plus, MoreVertical, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function SettingsPayments() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!session) return;
      try {
        const res = await fetch('/api/v1/resident/payment-methods', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const { payment_methods } = await res.json();
          setMethods(payment_methods || []);
        }
      } catch (err) {
        console.error("Failed to load payment methods", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
        <p className="text-gray-500 mt-2 flex items-center gap-2">
          Manage your saved cards and mobile money accounts for seamless rent and fee processing. 
          <span className="text-green-600 font-medium flex items-center gap-1 text-sm bg-green-50 px-2 py-0.5 rounded-md">
             <ShieldCheck className="w-4 h-4" /> Secured by Paystack
          </span>
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main List */}
        <div className="flex-1 w-full space-y-8">
          
          {/* Saved Cards */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Cards</h3>
            <div className="space-y-4">
              {methods.filter(m => m.type === 'card').length === 0 ? (
                <div className="border border-gray-200 rounded-2xl p-6 flex items-center gap-4 bg-white shadow-sm">
                  <div className="w-12 h-12 bg-[#eef2f6] rounded-xl flex items-center justify-center text-[#1b4f63]">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">Mastercard •••• 4242</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Expires 12/25</p>
                  </div>
                  <span className="bg-[#eef2f6] text-[#1b4f63] text-[10px] font-bold px-2.5 py-1 rounded-full">PRIMARY</span>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><MoreVertical className="w-5 h-5" /></button>
                </div>
              ) : (
                methods.filter(m => m.type === 'card').map(m => (
                  <div key={m.id} className="border border-gray-200 rounded-2xl p-6 flex items-center gap-4 bg-white shadow-sm">
                    <div className="w-12 h-12 bg-[#eef2f6] rounded-xl flex items-center justify-center text-[#1b4f63]">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm">{m.provider} •••• {m.masked_number}</h4>
                    </div>
                    {m.is_primary && <span className="bg-[#eef2f6] text-[#1b4f63] text-[10px] font-bold px-2.5 py-1 rounded-full">PRIMARY</span>}
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><MoreVertical className="w-5 h-5" /></button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Mobile Money */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mobile Money</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OPay placeholder */}
              <button className="border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white hover:border-[#1b4f63] hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-full bg-[#f0f4f8] flex items-center justify-center mb-4 group-hover:bg-[#eef2f6]">
                  <CreditCard className="w-5 h-5 text-[#1b4f63]" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Link OPay</h4>
                <p className="text-xs text-gray-500 mb-4">Connect your OPay wallet</p>
                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-[#1b4f63]">
                  <Plus className="w-4 h-4" />
                </div>
              </button>

              {/* Paga placeholder */}
              <button className="border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white hover:border-[#1b4f63] hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-full bg-[#f0f4f8] flex items-center justify-center mb-4 group-hover:bg-[#eef2f6]">
                  <Smartphone className="w-5 h-5 text-[#1b4f63]" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Link Paga</h4>
                <p className="text-xs text-gray-500 mb-4">Connect your Paga account</p>
                <div className="w-8 h-8 rounded-full bg-[#1b4f63] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
              </button>
            </div>
          </section>

          <button className="flex items-center gap-2 text-sm font-bold text-white bg-[#001f29] hover:bg-black px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Add New Payment Method
          </button>
        </div>

        {/* Info Column */}
        <div className="w-full lg:w-80 space-y-6 flex-shrink-0">
          <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" /> Secure Processing
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              All payment data is encrypted and securely processed by Paystack. We do not store your full card details on our servers.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1b4f63] to-[#001f29] text-white rounded-2xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
            <h3 className="font-bold text-sm mb-2 relative z-10">Auto-Pay Settings</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-6 relative z-10">
              Your primary card (ending in 4242) is currently set for automatic monthly deductions.
            </p>
            <button className="text-xs font-bold bg-white text-[#1b4f63] hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors relative z-10 w-full">
              Manage Auto-Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
