import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Accedi al tuo Account',
  description: 'Accedi al tuo account per continuare la preparazione all\'esame di Ruolo Conducenti Taxi e NCC. Recupera i tuoi progressi e statistiche.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
