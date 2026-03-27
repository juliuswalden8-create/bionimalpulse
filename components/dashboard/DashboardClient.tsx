'use client'

type Animal = {
  id: string
  name: string
  ear_tag: string
  species: string | null
  status: 'healthy' | 'watchlist' | 'critical'
  notes: string | null
  created_at: string
}

export default function DashboardClient({
  animals,
  stats,
}: {
  animals: Animal[]
  stats: {
    total: number
    healthy: number
    watchlist: number
    critical: number
  }
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">Djur totalt</p>
          <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">Friska</p>
          <p className="mt-2 text-3xl font-semibold">{stats.healthy}</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">Bevakning</p>
          <p className="mt-2 text-3xl font-semibold">{stats.watchlist}</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">Kritiska</p>
          <p className="mt-2 text-3xl font-semibold">{stats.critical}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-xl font-semibold">Senaste djur</h2>

        <div className="mt-4 space-y-3">
          {animals.map((animal) => (
            <div
              key={animal.id}
              className="rounded-xl border border-neutral-800 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{animal.name}</p>
                  <p className="text-sm text-neutral-400">
                    Öronmärke: {animal.ear_tag}
                  </p>
                </div>

                <span className="text-sm text-neutral-400">
                  {animal.status}
                </span>
              </div>

              {animal.notes && (
                <p className="mt-2 text-sm text-neutral-400">{animal.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}