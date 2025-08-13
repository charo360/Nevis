import { CbrandWizard } from '@/components/cbrand/cbrand-wizard';

export default function BrandProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Brand Profile Setup
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create a comprehensive brand profile with AI-powered analysis,
            detailed information sections, and professional customization options.
          </p>
        </div>

        <CbrandWizard />
      </div>
    </div>
  );
}
