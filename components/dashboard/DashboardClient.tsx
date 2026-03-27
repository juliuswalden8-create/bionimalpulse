'use client'

import { useState, useMemo, type ReactNode } from 'react'

type AnimalStatus = 'healthy' | 'watchlist' | 'critical'

type Animal = {
  id: string
  name: string
  ear_tag: string
  species: string | null
  status: AnimalStatus
  notes: string | null
  created_at: string
}

type InboxItem = {
  id: string
  sender: string
  subject: string
  channel: string
  date: string
}

type PriorityItem = {
  id: string
  level: string
  title: string
  text: string
}

type NavItem = 'dashboard' | 'animals'

export default function DashboardClient({
  animals,
  stats,
  inboxItems,
  priorities,
}: {
  animals: Animal[]
  stats: {
    total: number
    healthy: number
    watchlist: number
    critical: number
    unreadMail: number
  }
  inboxItems: InboxItem[]
  priorities: PriorityItem[]
}) {
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard')

  const criticalCount = useMemo(
    () => animals.filter((a) => a.status === 'critical').length,
    [animals]
  )

  return (
    <div className="min-h-screen bg-[#071122] text-white flex">
      <aside className="w-[260px] p-6 border-r border-white/10">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>

        <button onClick={() => setActiveNav('dashboard')} className="block mb-2">
          Dashboard
        </button>

        <button onClick={() => setActiveNav('animals')} className="block">
          Djur
        </button>
      </aside>

      <main className="flex-1 p-6">
        {activeNav === 'dashboard' && (
          <>
            <h2 className="text-3xl mb-6">Dashboard</h2>

            <div className="grid grid-cols-4 gap-4">
              <Stat label="Totalt" value={stats.total} />
              <Stat label="Friska" value={stats.healthy} />
              <Stat label="Bevakning" value={stats.watchlist} />
              <Stat label="Kritiska" value={stats.critical} />
            </div>

            <div className="mt-6">
              <h3>Kritiska djur: {criticalCount}</h3>
            </div>
          </>
        )}

        {activeNav === 'animals' && (
          <>
            <h2 className="text-3xl mb-6">Djur</h2>

            {animals.map((a) => (
              <div key={a.id} className="border p-4 mb-3 rounded">
                <h3>{a.name}</h3>
                <p>{a.ear_tag}</p>
                <p>{a.status}</p>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border rounded">
      <p>{label}</p>
      <p className="text-2xl">{value}</p>
    </div>
  )
}