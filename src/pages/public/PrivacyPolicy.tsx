import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicy() {
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">Last updated: June 26, 2026</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 prose prose-slate max-w-none prose-headings:text-[#1b4f63] prose-a:text-[#1b4f63]">
          <p>
            At Triid, we prioritize your privacy and the security of your personal data. This Privacy Policy describes how Triid ("we", "our", or "us") collects, uses, and shares information in connection with your use of our platforms, services, and applications.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h3>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Account Data:</strong> Name, email address, phone number, and password.</li>
            <li><strong>Profile Data:</strong> Address, location data, photos, and professional credentials for artisans.</li>
            <li><strong>Transaction Data:</strong> Payment details, booking history, and escrow records.</li>
            <li><strong>Communication Data:</strong> In-app messages, voice notes, and customer support interactions.</li>
          </ul>

          <h3 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h3>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Provide, maintain, and improve our services.</li>
            <li>Match residents with artisans based on proximity and skill requirements.</li>
            <li>Process payments and manage the escrow system.</li>
            <li>Send technical notices, updates, and administrative messages.</li>
            <li>Enhance platform safety, verify artisan credentials, and prevent fraud.</li>
          </ul>

          <h3 className="text-xl font-bold mt-8 mb-4">3. Data Sharing</h3>
          <p>
            We may share your information with trusted third-party vendors, service providers, and partners who assist us in operating our platform, conducting our business, or serving our users, so long as those parties agree to keep this information confidential. We do not sell your personal data to third parties.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">4. Your Rights</h3>
          <p>
            Depending on your location, you may have the right to access, correct, delete, or restrict the processing of your personal data. You can manage your data preferences directly within the Triid app settings.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">5. Contact Us</h3>
          <p>
            If you have any questions or concerns about this Privacy Policy, please contact us at <strong>privacy@triid.co</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}
