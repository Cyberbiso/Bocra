import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ComplaintForm from '@/components/dashboard/complaints/ComplaintForm'

export default function NewComplaintPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/complaints"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Complaints
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Submit a New Complaint</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete all three steps to submit your complaint to BOCRA.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <ComplaintForm />
      </div>
    </div>
  )
}
