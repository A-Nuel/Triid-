import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <header className="px-6 py-4 flex items-center bg-white border-b border-gray-200 sticky top-0 shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-4 text-gray-500 hover:text-[#1b4f63] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#003849] text-white rounded-md flex items-center justify-center font-bold text-sm">
            T
          </div>
          <span className="font-bold text-[#1b4f63] text-lg tracking-tight">Triid</span>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">Last updated: June 26, 2026</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 prose prose-slate max-w-none prose-headings:text-[#1b4f63] prose-a:text-[#1b4f63]">
          <p>
            Welcome to Triid. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h3>
          <p>
            By creating an account, whether as a Resident or an Artisan, you agree to these Terms. If you do not agree to all of these Terms, do not use the Triid platform.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">2. Description of Services</h3>
          <p>
            Triid provides a digital marketplace connecting Residents with skilled Artisans for maintenance, repair, and installation services. We facilitate the booking, communication, and secure payment processes through our escrow system. Triid itself does not provide home services and is not an employer of Artisans.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">3. User Responsibilities</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Accuracy:</strong> You must provide accurate and complete information when registering.</li>
            <li><strong>Conduct:</strong> Users must treat each other with respect. Harassment, discrimination, or abusive behavior will result in immediate account termination.</li>
            <li><strong>Compliance:</strong> Artisans must ensure they hold the necessary licenses and qualifications for the services they provide.</li>
          </ul>

          <h3 className="text-xl font-bold mt-8 mb-4">4. Payments and Escrow</h3>
          <p>
            All payments for services booked through Triid must be processed through our integrated escrow system.
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Funds are held securely and only released to the Artisan upon job completion and Resident confirmation.</li>
            <li>Attempting to bypass the Triid payment system is a violation of these Terms and may result in a permanent ban.</li>
            <li>In the event of a dispute, Triid's support team will mediate based on platform communication and job details.</li>
          </ul>

          <h3 className="text-xl font-bold mt-8 mb-4">5. Emergency Dispatches</h3>
          <p>
            Emergency dispatches require a baseline hold fee. The AI triage system provides estimated urgency and scope, but actual service requirements may vary upon physical inspection by the Artisan.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">6. Limitation of Liability</h3>
          <p>
            Triid is not liable for any direct, indirect, incidental, or consequential damages arising from the use of the platform or the services provided by Artisans. Our liability is limited to the maximum extent permitted by applicable law.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">7. Termination</h3>
          <p>
            We reserve the right to suspend or terminate your access to the platform at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">8. Changes to Terms</h3>
          <p>
            We may modify these Terms at any time. We will provide notice of significant changes. Your continued use of the platform after changes constitutes acceptance of the new Terms.
          </p>
        </div>
      </main>
    </div>
  );
}
