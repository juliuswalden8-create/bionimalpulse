'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AnimalStatus = 'ok' | 'warning' | 'alert'

type Animal = {
  id: string
  user_id: string
  name: string
  status: AnimalStatus
  battery: number
}

type ActivityItem = {
  id: string
  text: string
  time: string
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const [animals, setAnimals] = useState<Animal[]>([])
  const [search, setSearch] = useState('')

  const [name, setName] = useState('')
  const [battery, setBattery] = useState('100')

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBattery, setEditBattery] = useState('100')
  const [editSaving, setEditSaving] = useState(false)

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])

  function pushActivity(text: string) {
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    setActivityFeed((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        text,
        time: now,
      },
      ...prev,
    ].slice(0, 8))
  }

  function showSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 2500)
  }

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
    setAuthMessage('')
  }

  function getStatusFromBattery(batteryValue: number): AnimalStatus {
    if (batteryValue <= 10) return 'alert'
    if (batteryValue <= 30) return 'warning'
    return 'ok'
  }

  function getStatusLabel(status: AnimalStatus) {
    if (status === 'ok') return 'Healthy'
    if (status === 'warning') return 'Watchlist'
    return 'Critical'
  }

  function getStatusBadgeClass(status: AnimalStatus) {
    if (status === 'ok') {
      return 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    }
    if (status === 'warning') {
      return 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
    }
    return 'border border-red-500/20 bg-red-500/10 text-red-300'
  }

  function getBatteryBarClass(batteryValue: number) {
    if (batteryValue <= 10) return 'bg-red-500'
    if (batteryValue <= 30) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  function validateBattery(value: number) {
    if (Number.isNaN(value)) return 'Battery must be a number.'
    if (value < 0 || value > 100) return 'Battery must be between 0 and 100.'
    return null
  }

  async function fetchAnimals(showLoader = false) {
    if (!session?.user?.id) return

    if (showLoader) setRefreshing(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name', { ascending: true })

    if (showLoader) setRefreshing(false)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    const safeAnimals: Animal[] = (data || []).map((item: any) => ({
      id: String(item.id),
      user_id: String(item.user_id ?? ''),
      name: String(item.name ?? ''),
      status: getStatusFromBattery(Number(item.battery ?? 0)),
      battery: Number(item.battery ?? 0),
    }))

    setAnimals(safeAnimals)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnimals(true)
      pushActivity('Session initialized and portfolio synced.')
    } else {
      setAnimals([])
    }
  }, [session])

  useEffect(() => {
    if (!session?.user?.id) return

    const channel = supabase
      .channel(`animals-changes-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'animals',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchAnimals()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  async function signUp() {
    clearMessages()

    if (!email.trim() || !password.trim()) {
      setAuthMessage('Email and password are required.')
      return
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setAuthMessage('Account created. Check your email if confirmation is required.')
  }

  async function signIn() {
    clearMessages()

    if (!email.trim() || !password.trim()) {
      setAuthMessage('Email and password are required.')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setAuthMessage('')
  }

  async function logOut() {
    clearMessages()

    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setSession(null)
    setAnimals([])
  }

  async function addAnimal() {
    if (!session?.user?.id) {
      setErrorMessage('No logged in user found.')
      return
    }

    clearMessages()

    if (!name.trim()) {
      setErrorMessage('Name is required.')
      return
    }

    const batteryNumber = Number(battery)
    const batteryError = validateBattery(batteryNumber)

    if (batteryError) {
      setErrorMessage(batteryError)
      return
    }

    setSaving(true)

    const { error } = await supabase.from('animals').insert([
      {
        user_id: session.user.id,
        name: name.trim(),
        status: getStatusFromBattery(batteryNumber),
        battery: batteryNumber,
      },
    ])

    setSaving(false)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    pushActivity(`New asset registered: ${name.trim()}.`)
    setName('')
    setBattery('100')
    showSuccess('Animal added successfully.')
  }

  async function deleteAnimal(id: string) {
    if (!session?.user?.id) return
    if (!confirm('Are you sure you want to delete this animal?')) return

    clearMessages()
    setDeletingId(id)

    const animalToDelete = animals.find((animal) => animal.id === id)

    const { error } = await supabase
      .from('animals')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    setDeletingId(null)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    if (editingId === id) {
      cancelEdit()
    }

    pushActivity(`Asset removed: ${animalToDelete?.name ?? 'Unknown animal'}.`)
    showSuccess('Animal deleted successfully.')
  }

  function startEdit(animal: Animal) {
    clearMessages()
    setEditingId(animal.id)
    setEditName(animal.name)
    setEditBattery(String(animal.battery))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditBattery('100')
    setEditSaving(false)
  }

  async function saveEdit() {
    if (!session?.user?.id || !editingId) return

    clearMessages()

    if (!editName.trim()) {
      setErrorMessage('Name is required.')
      return
    }

    const batteryNumber = Number(editBattery)
    const batteryError = validateBattery(batteryNumber)

    if (batteryError) {
      setErrorMessage(batteryError)
      return
    }

    setEditSaving(true)

    const { error } = await supabase
      .from('animals')
      .update({
        name: editName.trim(),
        status: getStatusFromBattery(batteryNumber),
        battery: batteryNumber,
      })
      .eq('id', editingId)
      .eq('user_id', session.user.id)

    setEditSaving(false)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    pushActivity(`Asset updated: ${editName.trim()}.`)
    cancelEdit()
    showSuccess('Animal updated successfully.')
  }

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) =>
      animal.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [animals, search])

  const okCount = useMemo(
    () => animals.filter((animal) => animal.status === 'ok').length,
    [animals]
  )

  const warningCount = useMemo(
    () => animals.filter((animal) => animal.status === 'warning').length,
    [animals]
  )

  const alertCount = useMemo(
    () => animals.filter((animal) => animal.status === 'alert').length,
    [animals]
  )

  const avgBattery = useMemo(() => {
    if (animals.length === 0) return 0
    const total = animals.reduce((sum, animal) => sum + animal.battery, 0)
    return Math.round(total / animals.length)
  }, [animals])

  const criticalAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'alert'),
    [animals]
  )

  const warningAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'warning'),
    [animals]
  )

  const portfolioHealthScore = useMemo(() => {
    if (animals.length === 0) return 0
    return Math.max(
      0,
      Math.min(
        100,
        Math.round((okCount / animals.length) * 100 + avgBattery * 0.2)
      )
    )
  }, [animals, okCount, avgBattery])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07111f] text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-lg shadow-2xl backdrop-blur-xl">
            Loading command center...
          </div>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#07111f_0%,#0b1728_45%,#0f2137_100%)] text-white">
        <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-2">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex rounded-full border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-2 text-sm font-medium text-[#e7d4ac]">
              Binomial Pulse · Executive Monitoring Suite
            </div>

            <h1 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Enterprise livestock intelligence.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              A premium monitoring environment for battery health, asset visibility,
              escalation control and operational oversight in one institutional-grade interface.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">Live monitoring</div>
                <div className="mt-2 text-2xl font-semibold text-white">Realtime</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">Risk control</div>
                <div className="mt-2 text-2xl font-semibold text-white">Tiered alerts</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-slate-400">Decision layer</div>
                <div className="mt-2 text-2xl font-semibold text-white">Command view</div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
            <div className="mb-8">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Secure access
              </div>
              <h2 className="mt-2 text-3xl font-semibold text-white">Sign in</h2>
              <p className="mt-2 text-slate-300">
                Access the operational command center.
              </p>
            </div>

            <div className="space-y-4">
              <input
                className="w-full rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className="w-full rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={signIn}
                  className="rounded-2xl bg-[#c8a96b] px-5 py-3 font-medium text-[#0d1622] transition hover:opacity-90"
                >
                  Log in
                </button>

                <button
                  onClick={signUp}
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  Sign up
                </button>
              </div>

              {authMessage && (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                  {authMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#08111d] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] border-r border-white/10 bg-[#06101b] xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-8 py-7">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Binomial Pulse
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">Command Center</div>
          </div>

          <div className="flex-1 px-5 py-6">
            <div className="space-y-2">
              <div className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-3 text-[#eddcb8]">
                Overview
              </div>
              <div className="rounded-2xl px-4 py-3 text-slate-400">Asset Registry</div>
              <div className="rounded-2xl px-4 py-3 text-slate-400">Risk Monitoring</div>
              <div className="rounded-2xl px-4 py-3 text-slate-400">Operations Feed</div>
              <div className="rounded-2xl px-4 py-3 text-slate-400">Analytics</div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Session
              </div>
              <div className="mt-3 text-sm text-slate-300 break-all">{session.user.email}</div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Portfolio score
              </div>
              <div className="mt-3 text-4xl font-semibold text-white">
                {portfolioHealthScore}
              </div>
              <div className="mt-2 text-sm text-slate-400">Composite operating health</div>
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-5">
            <button
              onClick={logOut}
              className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-200"
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-white/10 bg-[#0a1523]/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Executive dashboard
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-white">
                  Operations Command View
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchAnimals(true)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>

                <button
                  onClick={logOut}
                  className="rounded-2xl bg-[#c8a96b] px-4 py-2.5 text-sm font-medium text-[#0d1622] transition hover:opacity-90 xl:hidden"
                >
                  Log out
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] px-6 py-8">
            <div className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-[1.45fr_0.85fr]">
              <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-2xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="text-sm uppercase tracking-[0.24em] text-slate-400">
                      Portfolio overview
                    </div>
                    <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                      Live livestock operations snapshot
                    </h2>
                    <p className="mt-4 text-slate-300">
                      Monitor battery health, isolate operational risk and manage field assets through a control-room interface designed for executive oversight.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-6 py-5">
                    <div className="text-sm text-[#ddcba6]">Average battery health</div>
                    <div className="mt-2 text-4xl font-semibold text-white">{avgBattery}%</div>
                  </div>
                </div>

                {(errorMessage || successMessage) && (
                  <div className="mt-6 space-y-3">
                    {errorMessage && (
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {errorMessage}
                      </div>
                    )}
                    {successMessage && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        {successMessage}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Risk summary
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div>
                      <div className="text-sm text-slate-400">Critical exposure</div>
                      <div className="mt-1 text-3xl font-semibold text-white">{alertCount}</div>
                    </div>
                    <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-300">
                      Alert
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div>
                      <div className="text-sm text-slate-400">Watchlist assets</div>
                      <div className="mt-1 text-3xl font-semibold text-white">{warningCount}</div>
                    </div>
                    <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
                      Warning
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div>
                      <div className="text-sm text-slate-400">Healthy assets</div>
                      <div className="mt-1 text-3xl font-semibold text-white">{okCount}</div>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                      Healthy
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Total assets</div>
                <div className="mt-4 text-5xl font-semibold text-white">{animals.length}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Healthy</div>
                <div className="mt-4 text-5xl font-semibold text-emerald-400">{okCount}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Warnings</div>
                <div className="mt-4 text-5xl font-semibold text-amber-400">{warningCount}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Critical</div>
                <div className="mt-4 text-5xl font-semibold text-red-400">{alertCount}</div>
              </div>
            </section>

            <div className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="mb-6">
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    Asset onboarding
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Register new animal
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_180px_auto]">
                  <input
                    className="rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    type="text"
                    placeholder="Animal name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <input
                    className="rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    type="number"
                    placeholder="Battery %"
                    value={battery}
                    onChange={(e) => setBattery(e.target.value)}
                  />

                  <button
                    onClick={addAnimal}
                    disabled={saving}
                    className="rounded-2xl bg-[#c8a96b] px-5 py-3 font-medium text-[#0d1622] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Adding...' : 'Add animal'}
                  </button>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Operations feed
                </div>
                <h3 className="mt-2 text-2xl font-semibold text-white">Recent activity</h3>

                <div className="mt-5 space-y-3">
                  {activityFeed.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-400">
                      No recent operational activity.
                    </div>
                  ) : (
                    activityFeed.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                      >
                        <div className="text-sm text-slate-200">{item.text}</div>
                        <div className="whitespace-nowrap text-xs text-slate-500">
                          {item.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {(criticalAnimals.length > 0 || warningAnimals.length > 0) && (
              <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {criticalAnimals.length > 0 && (
                  <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
                    <div className="text-sm uppercase tracking-[0.2em] text-red-300">
                      Critical escalation
                    </div>
                    <div className="mt-3 text-white">
                      {criticalAnimals.map((animal) => animal.name).join(', ')}
                    </div>
                  </div>
                )}

                {warningAnimals.length > 0 && (
                  <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
                    <div className="text-sm uppercase tracking-[0.2em] text-amber-300">
                      Watchlist
                    </div>
                    <div className="mt-3 text-white">
                      {warningAnimals.map((animal) => `${animal.name} (${animal.battery}%)`).join(', ')}
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="rounded-[2rem] border border-white/10 bg-[#0c1726] shadow-2xl">
              <div className="border-b border-white/10 px-8 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                      Monitoring registry
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Animal portfolio</h3>
                  </div>

                  <div className="w-full lg:max-w-sm">
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                      type="text"
                      placeholder="Search animal"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 md:px-8 md:py-6">
                {filteredAnimals.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-400">
                    No animals found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAnimals.map((animal) => (
                      <div
                        key={animal.id}
                        className="rounded-3xl border border-white/10 bg-[#0a1320] p-5 transition hover:border-white/20"
                      >
                        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.4fr_180px_240px_auto] 2xl:items-center">
                          <div>
                            <div className="text-xl font-semibold text-white">{animal.name}</div>
                            <div className="mt-3">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(animal.status)}`}
                              >
                                {getStatusLabel(animal.status)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-slate-500">Battery</div>
                            <div className="mt-2 text-3xl font-semibold text-white">
                              {animal.battery}%
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-slate-500">Power level</div>
                            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full ${getBatteryBarClass(animal.battery)}`}
                                style={{ width: `${Math.max(0, Math.min(100, animal.battery))}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 2xl:justify-end">
                            <button
                              onClick={() => startEdit(animal)}
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => deleteAnimal(animal.id)}
                              disabled={deletingId === animal.id}
                              className="rounded-2xl bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === animal.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>

                        {editingId === animal.id && (
                          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
                            <div className="mb-4 text-sm uppercase tracking-[0.2em] text-slate-500">
                              Edit asset
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_180px_auto_auto]">
                              <input
                                className="rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Animal name"
                              />

                              <input
                                className="rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                                type="number"
                                value={editBattery}
                                onChange={(e) => setEditBattery(e.target.value)}
                                placeholder="Battery %"
                              />

                              <button
                                onClick={saveEdit}
                                disabled={editSaving}
                                className="rounded-2xl bg-[#c8a96b] px-4 py-3 font-medium text-[#0d1622] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {editSaving ? 'Saving...' : 'Save'}
                              </button>

                              <button
                                onClick={cancelEdit}
                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}