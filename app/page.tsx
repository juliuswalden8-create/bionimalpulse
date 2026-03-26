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

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const [animals, setAnimals] = useState<Animal[]>([])
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [battery, setBattery] = useState('100')

  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBattery, setEditBattery] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchAnimals()
    } else {
      setAnimals([])
    }
  }, [session])

  function getStatusFromBattery(batteryValue: number): AnimalStatus {
    if (batteryValue <= 10) return 'alert'
    if (batteryValue <= 20) return 'warning'
    return 'ok'
  }

  function getStatusBadgeClass(status: AnimalStatus) {
    if (status === 'ok') return 'bg-green-100 text-green-700'
    if (status === 'warning') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  async function fetchAnimals() {
    if (!session?.user?.id) return

    setErrorMessage('')

    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    const safeAnimals: Animal[] = (data || []).map((item: any) => ({
      id: String(item.id),
      user_id: String(item.user_id ?? ''),
      name: item.name ?? '',
      status: (item.status ?? 'ok') as AnimalStatus,
      battery: Number(item.battery ?? 0),
    }))

    setAnimals(safeAnimals)
  }

  async function signUp() {
    setAuthMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setAuthMessage('Konto skapat. Kolla din mail om bekräftelse krävs.')
  }

  async function signIn() {
    setAuthMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setAuthMessage('')
  }

  async function logOut() {
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

    setErrorMessage('')

    if (!name.trim()) {
      setErrorMessage('Name is required.')
      return
    }

    const batteryNumber = Number(battery)

    if (Number.isNaN(batteryNumber)) {
      setErrorMessage('Battery must be a number.')
      return
    }

    const autoStatus = getStatusFromBattery(batteryNumber)

    const { error } = await supabase.from('animals').insert([
      {
        user_id: session.user.id,
        name: name.trim(),
        status: autoStatus,
        battery: batteryNumber,
      },
    ])

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    setName('')
    setBattery('100')
    fetchAnimals()
  }

  async function deleteAnimal(id: string) {
    if (!confirm('Är du säker att du vill ta bort detta animal?')) return
    if (!session?.user?.id) return

    setErrorMessage('')

    const { error } = await supabase
      .from('animals')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    if (editingId === id) {
      cancelEdit()
    }

    fetchAnimals()
  }

  function startEdit(animal: Animal) {
    setEditingId(animal.id)
    setEditName(animal.name)
    setEditBattery(animal.battery)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditBattery(0)
  }

  async function saveEdit() {
    if (!session?.user?.id) return
    if (!editingId) return

    setErrorMessage('')

    if (!editName.trim()) {
      setErrorMessage('Name is required.')
      return
    }

    const batteryNumber = Number(editBattery)

    if (Number.isNaN(batteryNumber)) {
      setErrorMessage('Battery must be a number.')
      return
    }

    const autoStatus = getStatusFromBattery(batteryNumber)

    const { error } = await supabase
      .from('animals')
      .update({
        name: editName.trim(),
        status: autoStatus,
        battery: batteryNumber,
      })
      .eq('id', editingId)
      .eq('user_id', session.user.id)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    cancelEdit()
    fetchAnimals()
  }

  const filteredAnimals = animals.filter((animal) =>
    animal.name.toLowerCase().includes(search.toLowerCase())
  )

  const criticalAlerts = useMemo(
    () => animals.filter((animal) => animal.status === 'alert'),
    [animals]
  )

  const lowBatteryAnimals = useMemo(
    () => animals.filter((animal) => animal.battery < 20),
    [animals]
  )

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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-6xl text-lg">Loading...</div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow">
          <h1 className="mb-2 text-3xl font-bold">Binomial Pulse</h1>
          <p className="mb-6 text-gray-600">Logga in för att hantera animals.</p>

          <div className="space-y-4">
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={signIn}
                className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white"
              >
                Log in
              </button>

              <button
                onClick={signUp}
                className="rounded-xl border border-gray-300 px-5 py-3 font-medium"
              >
                Sign up
              </button>
            </div>

            {authMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {authMessage}
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Animals Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">
              Track animal status, battery and alerts.
            </p>
          </div>

          <button
            onClick={logOut}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-gray-700 shadow-sm"
          >
            Log out
          </button>
        </div>

        {criticalAlerts.length > 0 && (
          <div className="mb-4 rounded-3xl border border-red-300 bg-red-50 p-5 text-red-700">
            <span className="font-bold">Critical alerts:</span>{' '}
            {criticalAlerts.map((animal) => animal.name).join(', ')}
          </div>
        )}

        {lowBatteryAnimals.length > 0 && (
          <div className="mb-8 rounded-3xl border border-yellow-300 bg-yellow-50 p-5 text-yellow-800">
            <span className="font-bold">Low battery:</span>{' '}
            {lowBatteryAnimals
              .map((animal) => `${animal.name} (${animal.battery}%)`)
              .join(', ')}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="text-lg text-gray-600">Total animals</div>
            <div className="mt-4 text-5xl font-bold text-gray-800">{animals.length}</div>
          </div>

          <div className="rounded-3xl bg-green-500 p-6 text-white shadow-sm">
            <div className="text-lg">OK</div>
            <div className="mt-4 text-5xl font-bold">{okCount}</div>
          </div>

          <div className="rounded-3xl bg-amber-400 p-6 text-white shadow-sm">
            <div className="text-lg">Warnings</div>
            <div className="mt-4 text-5xl font-bold">{warningCount}</div>
          </div>

          <div className="rounded-3xl bg-red-500 p-6 text-white shadow-sm">
            <div className="text-lg">Alerts</div>
            <div className="mt-4 text-5xl font-bold">{alertCount}</div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="text-lg text-gray-600">Avg battery</div>
            <div className="mt-4 text-5xl font-bold text-gray-800">{avgBattery}%</div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">Add animal</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_140px_auto]">
            <input
              className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
              type="text"
              placeholder="cow 5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
              type="number"
              placeholder="100"
              value={battery}
              onChange={(e) => setBattery(e.target.value)}
            />

            <button
              onClick={addAnimal}
              className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white"
            >
              Add
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              Error: {errorMessage}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">Animal list</h2>

          <input
            className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
            type="text"
            placeholder="Sök animal"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="space-y-4">
            {filteredAnimals.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-gray-500">
                No animals yet.
              </div>
            )}

            {filteredAnimals.map((animal) => (
              <div key={animal.id} className="rounded-2xl border border-gray-200 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xl font-semibold text-gray-800">{animal.name}</div>

                    <div className="mt-2">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(animal.status)}`}
                      >
                        {animal.status}
                      </span>
                    </div>

                    <div className="mt-2 text-gray-600">
                      Battery: <span className="font-medium">{animal.battery}%</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(animal)}
                      className="rounded-xl border border-gray-300 px-4 py-2"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteAnimal(animal.id)}
                      className="rounded-xl bg-red-600 px-4 py-2 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === animal.id && (
                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-[1.5fr_140px_auto_auto]">
                    <input
                      className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                    />

                    <input
                      className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
                      type="number"
                      value={editBattery}
                      onChange={(e) => setEditBattery(Number(e.target.value))}
                      placeholder="Battery"
                    />

                    <button
                      onClick={saveEdit}
                      className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white"
                    >
                      Save
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="rounded-xl border border-gray-300 px-4 py-3"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}