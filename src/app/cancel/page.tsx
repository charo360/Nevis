import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">Your payment was cancelled. No charges were made.</p>
        <div className="flex gap-2">
          <Link href="/dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">Back to Dashboard</Link>
          <Link href="/" className="inline-block px-4 py-2 border rounded">Home</Link>
        </div>
      </div>
    </div>
  )
}
