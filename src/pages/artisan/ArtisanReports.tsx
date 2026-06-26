import { useState, useEffect } from 'react';
import { Star, Clock, ShieldCheck, BarChart3, TrendingUp, MoreVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ArtisanReports() {
  const { session } = useAuth();
  const [stats, setStats] = useState({
    trust_score: 5.0,
    response_rate: 100,
    community_vouches: 0,
    earnings: 0,
    jobs_completed: 0,
    avg_time: "0h 0m"
  });

  useEffect(() => {
    async function fetchStats() {
      if (!session) return;
      try {
        const res = await fetch('/api/v1/artisan/reports', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch reports", err);
      }
    }
    fetchStats();
  }, [session]);
  return (
    <div className="max-w-5xl mx-auto p-space-6 md:p-space-8 w-full font-sans">
      
      {/* Header Tabs */}
      <div className="flex gap-space-6 border-b border-surface-variant mb-space-8">
        <button className="text-on-surface-variant font-semibold pb-space-3 hover:text-on-surface transition-colors">
          Monitoring
        </button>
        <button className="text-primary font-bold pb-space-3 border-b-2 border-primary">
          Reports
        </button>
      </div>

      <div className="mb-space-8">
        <h1 className="text-3xl font-bold text-primary mb-1 tracking-tight">Performance Overview</h1>
        <p className="text-on-surface-variant text-sm">Track your earnings and community standing.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4 mb-space-8">
        
        <div className="bg-white border border-surface-variant rounded-xl p-space-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Trust Score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary tracking-tight">{stats.trust_score.toFixed(1)}</span>
              <span className="text-sm text-on-surface-variant font-medium">/ 5.0</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
            <Star className="w-6 h-6 text-orange-500 fill-orange-500" />
          </div>
        </div>

        <div className="bg-white border border-surface-variant rounded-xl p-space-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Response Rate</p>
            <span className="text-3xl font-bold text-primary tracking-tight">{stats.response_rate}%</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-surface-variant rounded-xl p-space-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Community Vouches</p>
            <span className="text-3xl font-bold text-primary tracking-tight">{stats.community_vouches}</span>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-6">
        
        {/* Earnings Overview */}
        <div className="bg-white border border-surface-variant rounded-xl p-space-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-space-6">
            <div>
              <h2 className="text-lg font-bold text-primary">Earnings Overview</h2>
              <p className="text-sm text-on-surface-variant">This Month</p>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-space-6">
            <span className="text-4xl font-bold text-primary tracking-tight font-mono mb-2 block">₦{stats.earnings.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded">
              <TrendingUp className="w-3 h-3" /> 12.5% vs last month
            </span>
          </div>

          <div className="flex-1 min-h-[200px] bg-surface-bright rounded-lg border border-surface-variant flex flex-col items-center justify-center text-on-surface-variant" style={{ backgroundImage: 'radial-gradient(#1E3A8A 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: 'center', opacity: 0.6 }}>
            <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">Earnings Chart Visualization</p>
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="bg-white border border-surface-variant rounded-xl p-space-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-space-6">
            <h2 className="text-lg font-bold text-primary">Weekly Performance</h2>
            <div className="flex bg-surface-bright p-1 rounded-lg border border-surface-variant">
              <button className="px-3 py-1 text-xs font-bold bg-[#1b4f63] text-white rounded">Wk</button>
              <button className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:text-on-surface rounded">Mo</button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-space-4 mb-space-6">
            <div className="border border-surface-variant rounded-lg p-space-4">
              <p className="text-xs text-on-surface-variant font-semibold mb-1">Jobs Completed</p>
              <p className="text-2xl font-bold text-primary tracking-tight">{stats.jobs_completed}</p>
            </div>
            <div className="border border-surface-variant rounded-lg p-space-4">
              <p className="text-xs text-on-surface-variant font-semibold mb-1">Avg. Time</p>
              <p className="text-2xl font-bold text-primary tracking-tight">{stats.avg_time}</p>
            </div>
          </div>

          <div className="flex-1 min-h-[160px] bg-surface-bright rounded-lg border border-surface-variant flex flex-col items-center justify-center text-on-surface-variant" style={{ backgroundImage: 'radial-gradient(#1E3A8A 1px, transparent 1px)', backgroundSize: '16px 16px', backgroundPosition: 'center', opacity: 0.6 }}>
             <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
             <p className="text-sm font-medium">Performance Trend Line</p>
          </div>
        </div>

      </div>

    </div>
  );
}
