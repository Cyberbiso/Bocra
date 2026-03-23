'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import ComplaintForm from './ComplaintForm'

export default function ComplaintDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* DialogTrigger renders a <button> natively — style via className */}
      <DialogTrigger
        className="flex items-center gap-2 px-4 py-2 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6b] transition-colors shadow-sm"
      >
        <PlusCircle className="w-4 h-4" />
        Submit New Complaint
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        showCloseButton
      >
        <DialogTitle className="text-lg font-bold text-gray-900 mb-1">
          Submit a New Complaint
        </DialogTitle>

        <ComplaintForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
