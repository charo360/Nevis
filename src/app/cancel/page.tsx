import Link from 'next/link'
import { X } from 'lucide-react'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white p-10 rounded-2xl shadow-lg border border-red-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-red-100 text-red-600">
            <X className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Payment Cancelled</h1>
            <p className="text-sm text-gray-500">No charges were made. You can try again or go back to the dashboard.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard" className="block text-center px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors">Return to Dashboard</Link>
          <Link href="/" className="block text-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">Go to Home</Link>
          <Link href="/" className="block text-center px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">View Pricing</Link>
        </div>

        <div className="mt-6 text-xs text-gray-400 text-center">If you think this is an error, contact support@crevo.app</div>
      </div>
    </div>
  )
}
