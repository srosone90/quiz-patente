import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Statistiche e Progressi',
  description: 'Monitora i tuoi progressi nella preparazione all\'esame di Ruolo Conducenti Taxi e NCC. Statistiche dettagliate, quiz completati, e performance per categoria.',
  openGraph: {
    title: 'Dashboard Quiz Taxi/NCC Palermo',
    description: 'Monitora i tuoi progressi e statistiche di apprendimento',
  },
}

export default function DashboardPage() {
  redirect('/')
}
