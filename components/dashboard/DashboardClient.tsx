'use client'

import { useMemo, useState } from 'react'

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

type NavItem =
  | 'dashboard'
  | 'animals'
  | 'history'
  | 'tasks'
  | 'documents'
  | 'reports'
  | 'notifications'

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

  const activeNotes = useMemo(
    () => animals.filter((animal) => Boolean(animal.notes)).length,
    [animals]
  )

  const openTasks = useMemo(
    () => animals.filter((animal) => animal.status !== 'healthy').length,
    [animals]
  )

  const highPriorityAlerts = useMemo(
    () => animals.filter((animal) => animal.status === 'critical').length,
    [animals]
  )

  const totalAnimalsLabel = `${stats.total} djur registrerade`

  return (
    <div className="min-h-screen bg-[#071122] text-white">
      <div className="flex min-h-screen">
        <aside className="w-[330px] border-r border-white/10 bg-[#08101d] p-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-[#7f95b8]">
              Bionimal Pulse
            </p>
            <h1 className="mt-3 text-5xl font-semibold leading-none">Farm Admin</h1>
            <p className="mt-6 max-w-xs text-lg leading-9 text-[#93a4c4]">
              Administrativ panel för drift, historik, dokument, rapporter och
              kommunikation.
            </p>
          </div>

          <nav className="space-y-4">
            <SidebarItem
              active={activeNav === 'dashboard'}
              title="Dashboard"
              subtitle="Översikt"
              onClick={() => setActiveNav('dashboard')}
            />
            <SidebarItem
              active={activeNav === 'animals'}
              title="Djur"
              subtitle="Register"
              onClick={() => setActiveNav('animals')}
            />
            <SidebarItem
              active={activeNav === 'history'}
              title="Historik"
              subtitle="Noteringar"
              onClick={() => setActiveNav('history')}
            />
            <SidebarItem
              active={activeNav === 'tasks'}
              title="Uppgifter"
              subtitle="Att göra"
              onClick={() => setActiveNav('tasks')}
            />
            <SidebarItem
              active={activeNav === 'documents'}
              title="Dokument"
              subtitle="Filer"
              onClick={() => setActiveNav('documents')}
            />
            <SidebarItem
              active={activeNav === 'reports'}
              title="Rapporter"
              subtitle="Nyckeltal"
              onClick={() => setActiveNav('reports')}
            />
            <SidebarItem
              active={activeNav === 'notifications'}
              title="Aviseringar"
              subtitle="Händelser"
              onClick={() => setActiveNav('notifications')}
            />
          </nav>
        </aside>

        <main className="flex-1 px-7 py-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#7f95b8]">
                Bondens operativa center
              </p>
              <h2 className="mt-3 text-5xl font-semibold">Dashboard</h2>
            </div>

            <div className="rounded-full border border-[#2d3f5f] bg-[#0a1426] px-6 py-3 text-lg text-[#d6e2ff]">
              {totalAnimalsLabel}
            </div>
          </div>

          {activeNav === 'dashboard' && (
            <>
              <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                <StatCard label="Djur totalt" value={stats.total} valueClassName="text-white" />
                <StatCard label="Friska" value={stats.healthy} valueClassName="text-[#1ee0c0]" />
                <StatCard label="Bevakning" value={stats.watchlist} valueClassName="text-[#ffd43b]" />
                <StatCard label="Kritiska" value={stats.critical} valueClassName="text-[#ff6b7d]" />
                <StatCard label="Olästa mail" value={stats.unreadMail} valueClassName="text-[#59a8ff]" />
              </section>

              <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Panel eyebrow="Driftstatus" title="Snabböversikt">
                  <MiniStat label="Aktiva noteringar" value={activeNotes} />
                  <MiniStat label="Öppna uppgifter" value={openTasks} />
                  <MiniStat label="Högprioriterade aviseringar" value={highPriorityAlerts} />
                </Panel>

                <Panel eyebrow="Inbox" title="Senaste mail">
                  <div className="space-y-4">
                    {inboxItems.map((item) => (
                      <InboxCard key={item.id} item={item} />
                    ))}
                  </div>
                </Panel>

                <Panel eyebrow="Prioriteringar" title="Viktigt idag">
                  <div className="space-y-4">
                    {priorities.map((item) => (
                      <PriorityCard key={item.id} item={item} />
                    ))}
                  </div>
                </Panel>
              </section>
            </>
          )}

          {activeNav === 'animals' && (
            <Panel eyebrow="Register" title="Djuröversikt">
              <div className="space-y-4">
                {animals.map((animal) => (
                  <div
                    key={animal.id}
                    className="rounded-[28px] border border-white/10 bg-[#0b1628] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold">{animal.name}</h3>
                        <p className="mt-1 text-base text-[#95a7c8]">
                          Öronmärke: {animal.ear_tag}
                        </p>
                        {animal.species && (
                          <p className="mt-1 text-base text-[#95a7c8]">
                            Art: {animal.species}
                          </p>
                        )}
                      </div>

                      <StatusBadge status={animal.status} />
                    </div>

                    {animal.notes && (
                      <p className="mt-4 text-lg text-[#c7d2e8]">{animal.notes}</p>
                    )}

                    <p className="mt-4 text-sm text-[#7f95b8]">
                      Registrerad: {new Date(animal.created_at).toLocaleString('sv-SE')}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeNav !== 'dashboard' && activeNav !== 'animals' && (
            <Panel eyebrow="Modul" title="Kommer härnäst">
              <p className="text-lg leading-8 text-[#9cb0d1]">
                Den här sektionen är redo att kopplas vidare när vi bygger nästa
                backendflöde.
              </p>
            </Panel>
          )}
        </main>
      </div>
    </div>
  )
}

function SidebarItem({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[28px] border px-6 py-6 text-left transition ${
        active
          ? 'border-[#2f4163] bg-[#0d1830]'
          : 'border-transparent bg-transparent hover:border-white/10 hover:bg-[#0b1528]'
      }`}
    >
      <div className="text-[20px] font-medium text-white">{title}</div>
      <div className="mt-2 text-base text-[#6f85ab]">{subtitle}</div>
    </button>
  )
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: number
  valueClassName?: string
}) {
  return (
    <div className="rounded-[34px] border border-[#1d2d46] bg-[#081427] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
      <p className="text-sm uppercase tracking-[0.35em] text-[#6f85ab]">{label}</p>
      <p className={`mt-6 text-6xl font-semibold ${valueClassName ?? 'text-white'}`}>{value}</p>
    </div>
  )
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[40px] border border-[#1d2d46] bg-[#081427] p-7">
      <p className="text-sm uppercase tracking-[0.35em] text-[#6f85ab]">{eyebrow}</p>
      <h3 className="mt-4 text-5xl font-semibold">{title}</h3>
      <div className="mt-7">{children}</div>
    </section>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-4 rounded-[28px] border border-white/10 bg-[#0b1628] p-6 last:mb-0">
      <p className="text-base text-[#7f95b8]">{label}</p>
      <p className="mt-4 text-5xl font-semibold">{value}</p>
    </div>
  )
}

function InboxCard({ item }: { item: InboxItem }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0b1628] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[20px] font-medium">{item.sender}</p>
          <p className="mt-3 text-[19px] text-[#d7e1f4]">{item.subject}</p>
          <p className="mt-3 text-base text-[#7f95b8]">{item.date}</p>
        </div>

        <span className="rounded-full border border-[#4a2340] bg-[#21101b] px-4 py-2 text-sm text-[#ff7da8]">
          {item.channel}
        </span>
      </div>
    </div>
  )
}

function PriorityCard({ item }: { item: PriorityItem }) {
  const levelClasses =
    item.level === 'Hög'
      ? 'border-[#5b2430] bg-[#221016] text-[#ff7d91]'
      : item.level === 'Medel'
      ? 'border-[#5c4c1e] bg-[#211b0a] text-[#ffd24d]'
      : 'border-[#1d4782] bg-[#0d1c33] text-[#66a9ff]'

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0b1628] p-5">
      <span className={`rounded-full border px-4 py-2 text-sm ${levelClasses}`}>
        {item.level}
      </span>
      <p className="mt-4 text-[22px] font-medium">{item.title}</p>
      <p className="mt-4 text-lg leading-8 text-[#8ea2c5]">{item.text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: AnimalStatus }) {
  const map = {
    healthy: {
      label: 'Frisk',
      className: 'border-[#174f46] bg-[#0c221f] text-[#1ee0c0]',
    },
    watchlist: {
      label: 'Bevakning',
      className: 'border-[#5e4d16] bg-[#211b09] text-[#ffd43b]',
    },
    critical: {
      label: 'Kritisk',
      className: 'border-[#5b2430] bg-[#221016] text-[#ff7d91]',
    },
  }

  const config = map[status]

  return (
    <span className={`rounded-full border px-4 py-2 text-sm ${config.className}`}>
      {config.label}
    </span>
  )
}