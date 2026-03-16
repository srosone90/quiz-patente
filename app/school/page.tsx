'use client'

import dynamic from 'next/dynamic'

const SchoolDashboard = dynamic(() => import('@/components/SchoolDashboard'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-gray-600 dark:text-gray-300 text-lg">Caricamento...</div>
    </div>
  ),
  ssr: false,
})

export default function SchoolPage() {
  return <SchoolDashboard />
}
