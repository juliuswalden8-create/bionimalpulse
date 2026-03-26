'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AnimalStatus = 'healthy' | 'watchlist' | 'critical'

type DbAnimal = {
  id: string
  name: string | null
  ear_tag: string | null
  group_name: string | null
  status: string | null
  created_at: string | null
}

type Animal = {
  id: string
  name: string
  earTag: string
  groupName: string
  status: AnimalStatus
  createdAt: string | null
}

type FilterStatus = 'all' | AnimalStatus

function normalizeStatus(value: string | null | undefined): AnimalStatus {
  if (value === 'healthy' || value === 'watchlist' || value === 'critical') {
    return value
  }
  return 'healthy'
}

function statusLabel(status: AnimalStatus) {
  switch (status) {
    case 'healthy':
      return 'Frisk'
    case 'watchlist':
      return 'Bevakning'
    case 'critical':
      return 'Kritisk'
    default:
      return 'Frisk'
  }
}

function statusClass(status: AnimalStatus) {
  switch (status) {
    case 'healthy':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    case 'watchlist':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300'
    case 'critical':
      return 'border-red-500/20 bg-red-500/10 text-red-300'
    default:
      return 'border-white/10 bg-white/5 text-slate-300'
  }
}

function formatDate(value: string | null) {
  if (!value) return 'Okänt datum'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Okänt datum'

  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function Sidebar() {
  return (
    <aside className="hidden w-[290px] border-r border-white/10 bg-[#08111d] xl:flex xl:flex-col">
      <div className="border-b border-white/10 px-8 py-7">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Bionimal Pulse</div>
        <div className="mt-2 text-2xl font-semibold text-white">Farm Admin</div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Enkel driftpanel för registrering, sökning och översikt av djur.
        </p>
      </div>

      <div className="flex-1 px-5 py-6">
        <div className="space-y-2">
          <div className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-3 text-[#eddcb8]">
            Djuröversikt
          </div>
          <div className="rounded-2xl px-4 py-3 text-slate-500">Uppgifter</div>
          <div className="rounded-2xl px-4 py-3 text-slate-500">Dokument</div>
          <div className="rounded-2xl px-4 py-3 text-slate-500">Inställningar</div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Status</div>
          <div className="mt-3 text-sm leading-6 text-slate-300">
            Första versionen fokuserar på stabil registrering, sökning och tydlig överblick.
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-5">
          <div className="text-sm uppercase tracking-[0.2em] text-emerald-300">Tips</div>
          <div className="mt-3 text-sm leading-6 text-slate-300">
            Nästa naturliga steg är redigera, ta bort, anteckningar och uppgifter per djur.
          </div>
        </div>
      </div>
    </aside>
  )
}

function MetricCard({
  title,
  value,
  valueClassName = 'text-white',
}: {
  title: string
  value: string | number
  valueClassName?: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
      <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</div>
      <div className={`mt-4 text-5xl font-semibold ${valueClassName}`}>{value}</div>
    </div>
  )
}

function TopHeader({ totalAnimals }: { totalAnimals: number }) {
  return (
    <header className="border-b border-white/10 bg-[#0a1523]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Bondens operativa center
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-white">Djuröversikt</h1>
        </div>

        <div className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-2 text-sm text-[#eddcb8]">
          {totalAnimals} djur registrerade
        </div>
      </div>
    </header>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-[#0a1320] p-8 text-center">
      <div className="text-lg font-medium text-white">Inga djur matchar just nu</div>
      <p className="mt-2 text-sm text-slate-400">
        Prova att ändra sökning eller filter, eller registrera ett nytt djur.
      </p>
    </div>
  )
}

export default function Page() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const [form, setForm] = useState({
    name: '',
    earTag: '',
    groupName: '',
    status: 'healthy' as AnimalStatus,
  })

  async function loadAnimals() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('animals')
      .select('id, name, ear_tag, group_name, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('loadAnimals error:', error)
      setAnimals([])
      setErrorMessage(`Kunde inte hämta djur: ${error.message}`)
      setLoading(false)
      return
    }

    const mapped: Animal[] = ((data ?? []) as DbAnimal[]).map((animal) => ({
      id: animal.id,
      name: animal.name ?? 'Okänt djur',
      earTag: animal.ear_tag ?? '',
      groupName: animal.group_name ?? '',
      status: normalizeStatus(animal.status),
      createdAt: animal.created_at ?? null,
    }))

    setAnimals(mapped)
    setLoading(false)
  }

  useEffect(() => {
    loadAnimals()
  }, [])

  function resetForm() {
    setForm({
      name: '',
      earTag: '',
      groupName: '',
      status: 'healthy',
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const name = form.name.trim()
    const earTag = form.earTag.trim()
    const groupName = form.groupName.trim()

    if (!name) {
      setSaving(false)
      setErrorMessage('Du måste ange namn.')
      return
    }

    if (!groupName) {
      setSaving(false)
      setErrorMessage('Du måste ange ladugård.')
      return
    }

    const payload = {
      name,
      ear_tag: earTag || null,
      group_name: groupName,
      status: form.status,
    }

    const { error } = await supabase.from('animals').insert([payload])

    setSaving(false)

    if (error) {
      console.error('insert error:', error)
      setErrorMessage(`Kunde inte spara djuret: ${error.message}`)
      return
    }

    setSuccessMessage('Djuret sparades.')
    resetForm()
    await loadAnimals()
  }

  const healthyCount = useMemo(
    () => animals.filter((animal) => animal.status === 'healthy').length,
    [animals]
  )

  const watchlistCount = useMemo(
    () => animals.filter((animal) => animal.status === 'watchlist').length,
    [animals]
  )

  const criticalCount = useMemo(
    () => animals.filter((animal) => animal.status === 'critical').length,
    [animals]
  )

  const filteredAnimals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return animals.filter((animal) => {
      const matchesQuery =
        !normalizedQuery ||
        animal.name.toLowerCase().includes(normalizedQuery) ||
        animal.earTag.toLowerCase().includes(normalizedQuery) ||
        animal.groupName.toLowerCase().includes(normalizedQuery)

      const matchesStatus = filterStatus === 'all' || animal.status === filterStatus

      return matchesQuery && matchesStatus
    })
  }, [animals, query, filterStatus])

  return (
    <main className="min-h-screen bg-[#08111d] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1">
          <TopHeader totalAnimals={animals.length} />

          <div className="mx-auto max-w-[1600px] px-6 py-8">
            {errorMessage ? (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                {successMessage}
              </div>
            ) : null}

            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Totalt" value={animals.length} />
              <MetricCard title="Friska" value={healthyCount} valueClassName="text-emerald-400" />
              <MetricCard
                title="Bevakning"
                value={watchlistCount}
                valueClassName="text-amber-400"
              />
              <MetricCard title="Kritiska" value={criticalCount} valueClassName="text-red-400" />
            </section>

            <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Registrering</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">Lägg till djur</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Registrera namn, öronmärke, ladugård och status.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Namn"
                    required
                    className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />

                  <input
                    value={form.earTag}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        earTag: e.target.value,
                      }))
                    }
                    placeholder="Öronmärke"
                    className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />

                  <input
                    value={form.groupName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        groupName: e.target.value,
                      }))
                    }
                    placeholder="Ladugård"
                    required
                    className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as AnimalStatus,
                      }))
                    }
                    className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
                  >
                    <option value="healthy">Frisk</option>
                    <option value="watchlist">Bevakning</option>
                    <option value="critical">Kritisk</option>
                  </select>

                  <div className="flex gap-3 md:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-5 py-3 text-[#eddcb8] transition hover:bg-[#c8a96b]/20 disabled:opacity-60"
                    >
                      {saving ? 'Sparar...' : 'Skapa djur'}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-slate-300 transition hover:bg-white/10"
                    >
                      Rensa
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Register</div>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Sparade djur</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Sök bland djur och filtrera på status.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Sök namn, öronmärke eller ladugård"
                      className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    />

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                      className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
                    >
                      <option value="all">Alla statusar</option>
                      <option value="healthy">Frisk</option>
                      <option value="watchlist">Bevakning</option>
                      <option value="critical">Kritisk</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {loading ? (
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5 text-slate-400">
                      Laddar djur...
                    </div>
                  ) : filteredAnimals.length === 0 ? (
                    <EmptyState />
                  ) : (
                    filteredAnimals.map((animal) => (
                      <div
                        key={animal.id}
                        className="rounded-3xl border border-white/10 bg-[#0a1320] p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="text-xl font-semibold text-white">{animal.name}</div>
                              <span
                                className={`rounded-full border px-3 py-1 text-sm ${statusClass(animal.status)}`}
                              >
                                {statusLabel(animal.status)}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-1 text-sm text-slate-400">
                              <div>Öronmärke: {animal.earTag || '–'}</div>
                              <div>Ladugård: {animal.groupName || '–'}</div>
                              <div>Skapad: {formatDate(animal.createdAt)}</div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                            Aktiv post
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <div className="mt-8 rounded-[2rem] border border-[#c8a96b]/20 bg-[#c8a96b]/10 p-6 text-[#eddcb8]">
              Nästa steg: redigera djur, ta bort djur, anteckningar per djur och uppgifter kopplade till varje individ.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
