import { CbrandWizardUnified } from '@/components/cbrand/cbrand-wizard-unified';

export default function CbrandPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create New Brand Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create a comprehensive brand profile with AI-powered analysis,
            detailed information sections, and professional customization options.
          </p>
        </div>

        <CbrandWizardUnified mode="create" />
      </div>
    </div>
  );
}
