import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

type Animal = {
  id: string
  name: string
  ear_tag: string
  species: string | null
  status: 'healthy' | 'watchlist' | 'critical'
  notes: string | null
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: animals, error } = await supabase
    .from('animals')
    .select('id, name, ear_tag, species, status, notes, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch animals:', error)
  }

  const animalList: Animal[] = animals ?? []

  const stats = {
    total: animalList.length,
    healthy: animalList.filter((animal) => animal.status === 'healthy').length,
    watchlist: animalList.filter((animal) => animal.status === 'watchlist').length,
    critical: animalList.filter((animal) => animal.status === 'critical').length,
    unreadMail: 2,
  }

  const inboxItems = [
    {
      id: '1',
      sender: 'Anna Svensson',
      subject: 'Fråga om leverans till ladugård 2',
      channel: 'Gmail',
      date: '27 mars 2026 10:15',
    },
    {
      id: '2',
      sender: 'Johan Ekonomi',
      subject: 'Faktura för mars',
      channel: 'Outlook',
      date: '26 mars 2026 15:40',
    },
    {
      id: '3',
      sender: 'Support',
      subject: 'Nytt ärende registrerat',
      channel: 'IMAP',
      date: '26 mars 2026 12:10',
    },
  ]

  const priorities = [
    {
      id: '1',
      level: 'Hög',
      title: 'Kritiskt djur registrerat',
      text: 'Ett djur har status kritisk och bör följas upp idag.',
    },
    {
      id: '2',
      level: 'Medel',
      title: 'Ny ekonomifråga i inbox',
      text: 'Ett nytt mail relaterat till faktura har kommit in.',
    },
    {
      id: '3',
      level: 'Låg',
      title: 'Rapport inte uppdaterad',
      text: 'Veckorapporten har inte uppdaterats de senaste 7 dagarna.',
    },
  ]

  return (
    <DashboardClient
      animals={animalList}
      stats={stats}
      inboxItems={inboxItems}
      priorities={priorities}
    />
  )
}