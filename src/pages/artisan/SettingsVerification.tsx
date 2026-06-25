import { Shield, ShieldCheck, FileText, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";

export function SettingsVerification() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Identity & Verification</h1>
        <p className="text-gray-500 mt-1">Manage your high-trust credentials and community standing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 border-2 border-green-500 flex flex-col items-center justify-center text-center shadow-sm">
            <ShieldCheck className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Current Verification Status: Vouched</h2>
            <p className="text-gray-600 mt-2 max-w-md">
              Your identity has been confirmed by trusted community members and formal documentation.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Required Documents</h3>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 md:p-6 border-l-4 border-l-green-500 border border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">ID Document</h4>
                    <p className="text-sm text-gray-500">Government Issued ID</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 md:p-6 border-l-4 border-l-orange-400 border border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Residency Proof</h4>
                    <p className="text-sm text-gray-500">Utility bill or lease agreement</p>
                  </div>
                </div>
                <button className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800 font-bold mb-2">
              <ArrowUpRight className="w-5 h-5" />
              Visibility Boost
            </div>
            <p className="text-sm text-blue-900 leading-relaxed">
              Verified artisans appear in up to <span className="font-bold">3x more search results</span> and receive priority dispatch routing for emergency requests.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Vouch History</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Chidi`} alt="Chidi" className="w-10 h-10 rounded-full bg-gray-100" />
                <div>
                  <div className="font-bold text-gray-900 text-sm">Chidi Okafor</div>
                  <div className="text-xs text-gray-500">Resident since 2022 • Vouched on Oct 12, 2023</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Amina`} alt="Amina" className="w-10 h-10 rounded-full bg-gray-100" />
                <div>
                  <div className="font-bold text-gray-900 text-sm">Amina Bello</div>
                  <div className="text-xs text-gray-500">Community Leader • Vouched on Sep 05, 2023</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
