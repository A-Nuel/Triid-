import { SecuritySettings } from '@/components/SecuritySettings';

export function SettingsSecurity() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Security & Authentication</h1>
        <p className="text-gray-500 mt-2">Manage your password, active sessions, and 2-step verification.</p>
      </div>

      <div className="max-w-3xl">
        <SecuritySettings />
      </div>
    </div>
  );
}
