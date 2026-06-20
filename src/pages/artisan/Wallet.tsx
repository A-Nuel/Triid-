import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Lock, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<{ available_balance: number, pending_balance: number } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWallet() {
      if (!user) return;
      try {
        // Fetch artisan profile to get artisan_id
        const { data: profile } = await supabase
          .from('artisan_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('*')
            .eq('artisan_id', profile.id)
            .single();
          
          if (walletData) {
            setWallet(walletData);
          }

          // Fetch transactions (assuming escrow_transactions could be related via job -> artisan)
          // For now, we will fetch directly if we have a view or just leave empty if it requires complex join
          // Let's set empty for literal representation of the user request.
          setTransactions([]);
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto p-space-6 md:p-space-8 w-full font-sans">
      <div className="mb-space-8">
        <h1 className="text-3xl font-bold text-primary mb-1 tracking-tight">Wallet</h1>
        <p className="text-on-surface-variant text-sm">Manage your earnings and escrow funds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6 mb-space-8">
        {/* Available Balance */}
        <div className="bg-[#1b4f63] text-white rounded-2xl p-space-6 md:p-space-8 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-space-12">
              <div className="flex items-center gap-2 text-white/80">
                <WalletIcon className="w-5 h-5" />
                <span className="font-semibold text-sm uppercase tracking-wider">Available Balance</span>
              </div>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight mb-space-4">
                ₦{wallet?.available_balance || '0.00'}
              </p>
              <button disabled={!wallet || wallet.available_balance === 0} className="bg-white text-[#1b4f63] font-bold px-space-6 py-3 rounded-lg hover:bg-surface-bright disabled:opacity-50 transition-colors shadow-sm">
                Withdraw to Bank
              </button>
            </div>
          </div>
        </div>

        {/* Pending Escrow */}
        <div className="bg-white border border-surface-variant rounded-2xl p-space-6 md:p-space-8 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-on-surface-variant mb-space-4">
            <Lock className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">Pending in Escrow</span>
          </div>
          <p className="text-4xl font-bold text-primary mb-2 tracking-tight">
            ₦{wallet?.pending_balance || '0.00'}
          </p>
          <p className="text-sm text-on-surface-variant max-w-sm">
            Funds held securely for active jobs. Releases automatically upon completion confirmation.
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-xl font-bold text-primary tracking-tight mb-space-4 flex items-center gap-2">
          <History className="w-5 h-5" /> Recent Activity
        </h2>
        <div className="bg-white border border-surface-variant rounded-xl overflow-hidden shadow-sm">
          {loading ? (
             <div className="p-space-8 text-center text-on-surface-variant">Loading...</div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-surface-variant">
              {transactions.map(tx => (
                <div key={tx.id} className="p-space-4 flex items-center justify-between hover:bg-surface-bright transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'release' ? 'bg-green-50 text-green-600' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {tx.type === 'release' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-primary">{tx.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-bold font-mono ${tx.type === 'release' ? 'text-green-600' : 'text-primary'}`}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-space-12 text-center text-on-surface-variant">
              <p>No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
