'use client'

import dynamic from 'next/dynamic'

const AuthForm = dynamic(() => import('@/components/AuthForm'), {
  loading: () => <div className="min-h-screen flex items-center justify-center bg-primary">
    <div className="text-white text-xl">Caricamento...</div>
  </div>,
  ssr: false
})

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <AuthForm />
    </div>
  )
}
