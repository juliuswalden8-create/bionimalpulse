'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AnimalStatus = 'healthy' | 'watchlist' | 'critical'
type AnimalPriority = 'Hög' | 'Medel' | 'Låg'
type TaskStatus = 'today' | 'upcoming' | 'overdue' | 'done'
type Section = 'overview' | 'animals' | 'tasks'
type AnimalFilter = 'all' | AnimalStatus

type DbAnimal = {
  id?: string | null
  name?: string | null
  ear_tag?: string | null
  barn?: string | null
  group_name?: string | null
  battery?: number | null
  status?: string | null
  deviation?: string | null
  last_observation?: string | null
  priority?: string | null
  assigned_to?: string | null
  created_at?: string | null
}

type Animal = {
  id: string
  name: string
  earTag: string
  barn: string
  group: string
  battery: number
  status: AnimalStatus
  deviation: string
  lastObservation: string
  priority: AnimalPriority
  assignedTo: string
}

type DbTask = {
  id?: string | null
  title?: string | null
  owner?: string | null
  due?: string | null
  status?: string | null
  related_to?: string | null
  created_at?: string | null
}

type FarmTask = {
  id: string
  title: string
  owner: string
  due: string
  status: TaskStatus
  relatedTo: string
}

function safeAnimalStatus(value: string | null | undefined): AnimalStatus {
  if (value === 'healthy' || value === 'watchlist' || value === 'critical') return value
  return 'healthy'
}

function safePriority(value: string | null | undefined): AnimalPriority {
  if (value === 'Hög' || value === 'Medel' || value === 'Låg') return value
  return 'Medel'
}

function safeTaskStatus(value: string | null | undefined): TaskStatus {
  if (value === 'today' || value === 'upcoming' || value === 'overdue' || value === 'done') {
    return value
  }
  return 'today'
}

function animalStatusLabel(status: AnimalStatus) {
  if (status === 'healthy') return 'Frisk'
  if (status === 'watchlist') return 'Bevakning'
  return 'Kritisk'
}

function animalStatusClass(status: AnimalStatus) {
  if (status === 'healthy') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
  if (status === 'watchlist') return 'border-amber-500/20 bg-amber-500/10 text-amber-300'
  return 'border-red-500/20 bg-red-500/10 text-red-300'
}

function taskStatusLabel(status: TaskStatus) {
  if (status === 'today') return 'Idag'
  if (status === 'upcoming') return 'Kommande'
  if (status === 'overdue') return 'Försenad'
  return 'Klar'
}

function taskStatusClass(status: TaskStatus) {
  if (status === 'today') return 'border-sky-500/20 bg-sky-500/10 text-sky-300'
  if (status === 'upcoming') return 'border-violet-500/20 bg-violet-500/10 text-violet-300'
  if (status === 'overdue') return 'border-red-500/20 bg-red-500/10 text-red-300'
  return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
}

function SectionButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm transition ${
        active
          ? 'border border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
          : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </div>
  )
}

function Card({
  title,
  children,
  right,
}: {
  title: string
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        {right}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  )
}

export default function Page() {
  const [activeSection, setActiveSection] = useState<Section>('overview')

  const [animals, setAnimals] = useState<Animal[]>([])
  const [tasks, setTasks] = useState<FarmTask[]>([])

  const [animalsLoading, setAnimalsLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(true)

  const [animalSearch, setAnimalSearch] = useState('')
  const [animalFilter, setAnimalFilter] = useState<AnimalFilter>('all')
  const [taskSearch, setTaskSearch] = useState('')

  const [selectedAnimalId, setSelectedAnimalId] = useState('')

  const [animalForm, setAnimalForm] = useState({
    name: '',
    earTag: '',
    barn: '',
    group: '',
    battery: '100',
    status: 'healthy' as AnimalStatus,
    deviation: '',
    lastObservation: '',
    priority: 'Medel' as AnimalPriority,
    assignedTo: '',
  })

  const [taskForm, setTaskForm] = useState({
    title: '',
    owner: '',
    due: '',
    status: 'today' as TaskStatus,
    relatedTo: '',
  })

  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const [savingAnimal, setSavingAnimal] = useState(false)
  const [savingTask, setSavingTask] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadAnimals() {
    setAnimalsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setErrorMessage('Kunde inte hämta djur från Supabase.')
      setAnimals([])
      setAnimalsLoading(false)
      return
    }

    const mapped: Animal[] = ((data ?? []) as DbAnimal[]).map((animal, index) => ({
      id: animal.id ?? `missing-${index}`,
      name: animal.name ?? 'Okänt djur',
      earTag: animal.ear_tag ?? '',
      barn: animal.barn ?? '',
      group: animal.group_name ?? '',
      battery: animal.battery ?? 0,
      status: safeAnimalStatus(animal.status),
      deviation: animal.deviation ?? '',
      lastObservation: animal.last_observation ?? '',
      priority: safePriority(animal.priority),
      assignedTo: animal.assigned_to ?? '',
    }))

    setAnimals(mapped)
    setSelectedAnimalId((current) => {
      if (!mapped.length) return ''
      if (current && mapped.some((a) => a.id === current)) return current
      return mapped[0].id
    })
    setAnimalsLoading(false)
  }

  async function loadTasks() {
    setTasksLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setErrorMessage('Kunde inte hämta uppgifter från Supabase.')
      setTasks([])
      setTasksLoading(false)
      return
    }

    const mapped: FarmTask[] = ((data ?? []) as DbTask[]).map((task, index) => ({
      id: task.id ?? `task-${index}`,
      title: task.title ?? 'Namnlös uppgift',
      owner: task.owner ?? '',
      due: task.due ?? '',
      status: safeTaskStatus(task.status),
      relatedTo: task.related_to ?? '',
    }))

    setTasks(mapped)
    setTasksLoading(false)
  }

  useEffect(() => {
    loadAnimals()
    loadTasks()
  }, [])

  const criticalAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'critical'),
    [animals]
  )

  const watchlistAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'watchlist'),
    [animals]
  )

  const healthyAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'healthy'),
    [animals]
  )

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const matchesSearch = [
        animal.name,
        animal.earTag,
        animal.barn,
        animal.group,
        animal.assignedTo,
        animal.deviation,
      ]
        .join(' ')
        .toLowerCase()
        .includes(animalSearch.toLowerCase())

      const matchesFilter = animalFilter === 'all' ? true : animal.status === animalFilter
      return matchesSearch && matchesFilter
    })
  }, [animals, animalSearch, animalFilter])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      return [task.title, task.owner, task.due, task.relatedTo]
        .join(' ')
        .toLowerCase()
        .includes(taskSearch.toLowerCase())
    })
  }, [tasks, taskSearch])

  const selectedAnimal = useMemo(
    () => animals.find((animal) => animal.id === selectedAnimalId),
    [animals, selectedAnimalId]
  )

  function resetAnimalForm() {
    setAnimalForm({
      name: '',
      earTag: '',
      barn: '',
      group: '',
      battery: '100',
      status: 'healthy',
      deviation: '',
      lastObservation: '',
      priority: 'Medel',
      assignedTo: '',
    })
    setEditingAnimalId(null)
  }

  function resetTaskForm() {
    setTaskForm({
      title: '',
      owner: '',
      due: '',
      status: 'today',
      relatedTo: '',
    })
    setEditingTaskId(null)
  }

  function startEditAnimal(animal: Animal) {
    setEditingAnimalId(animal.id)
    setAnimalForm({
      name: animal.name,
      earTag: animal.earTag,
      barn: animal.barn,
      group: animal.group,
      battery: String(animal.battery),
      status: animal.status,
      deviation: animal.deviation,
      lastObservation: animal.lastObservation,
      priority: animal.priority,
      assignedTo: animal.assignedTo,
    })
    setActiveSection('animals')
  }

  function startEditTask(task: FarmTask) {
    setEditingTaskId(task.id)
    setTaskForm({
      title: task.title,
      owner: task.owner,
      due: task.due,
      status: task.status,
      relatedTo: task.relatedTo,
    })
    setActiveSection('tasks')
  }

  async function handleAnimalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingAnimal(true)
    setErrorMessage('')

    const payload = {
      name: animalForm.name,
      ear_tag: animalForm.earTag,
      barn: animalForm.barn,
      group_name: animalForm.group,
      battery: Number(animalForm.battery || 0),
      status: animalForm.status,
      deviation: animalForm.deviation,
      last_observation: animalForm.lastObservation,
      priority: animalForm.priority,
      assigned_to: animalForm.assignedTo,
    }

    let error = null

    if (editingAnimalId) {
      const response = await supabase.from('animals').update(payload).eq('id', editingAnimalId)
      error = response.error
    } else {
      const response = await supabase.from('animals').insert(payload)
      error = response.error
    }

    setSavingAnimal(false)

    if (error) {
      console.error(error)
      setErrorMessage('Kunde inte spara djuret.')
      return
    }

    await loadAnimals()
    resetAnimalForm()
  }

  async function handleDeleteAnimal(id: string) {
    const confirmed = window.confirm('Vill du verkligen ta bort detta djur?')
    if (!confirmed) return

    const { error } = await supabase.from('animals').delete().eq('id', id)

    if (error) {
      console.error(error)
      setErrorMessage('Kunde inte ta bort djuret.')
      return
    }

    await loadAnimals()
    if (selectedAnimalId === id) {
      setSelectedAnimalId('')
    }
    if (editingAnimalId === id) {
      resetAnimalForm()
    }
  }

  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingTask(true)
    setErrorMessage('')

    const payload = {
      title: taskForm.title,
      owner: taskForm.owner,
      due: taskForm.due,
      status: taskForm.status,
      related_to: taskForm.relatedTo,
    }

    let error = null

    if (editingTaskId) {
      const response = await supabase.from('tasks').update(payload).eq('id', editingTaskId)
      error = response.error
    } else {
      const response = await supabase.from('tasks').insert(payload)
      error = response.error
    }

    setSavingTask(false)

    if (error) {
      console.error(error)
      setErrorMessage('Kunde inte spara uppgiften.')
      return
    }

    await loadTasks()
    resetTaskForm()
  }

  async function handleToggleTaskDone(task: FarmTask) {
    const nextStatus: TaskStatus = task.status === 'done' ? 'today' : 'done'

    const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id)

    if (error) {
      console.error(error)
      setErrorMessage('Kunde inte uppdatera uppgiften.')
      return
    }

    await loadTasks()
  }

  async function handleDeleteTask(id: string) {
    const confirmed = window.confirm('Vill du verkligen ta bort denna uppgift?')
    if (!confirmed) return

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error(error)
      setErrorMessage('Kunde inte ta bort uppgiften.')
      return
    }

    await loadTasks()
    if (editingTaskId === id) {
      resetTaskForm()
    }
  }

  function processStatus() {
    if (animals.length === 0) return 'Ingen data ännu'
    if (criticalAnimals.length > 0) return 'Kräver omedelbar uppmärksamhet'
    if (watchlistAnimals.length > 0) return 'Bevakas aktivt'
    return 'Stabil drift'
  }

  function renderOverview() {
    return (
      <div className="space-y-6">
        <Card
          title="Bionimal Process Status"
          right={
            <div
              className={`rounded-2xl border px-4 py-2 text-sm ${
                criticalAnimals.length > 0
                  ? 'border-red-500/20 bg-red-500/10 text-red-300'
                  : watchlistAnimals.length > 0
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {processStatus()}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
              <div className="text-sm text-slate-400">Totalt antal djur</div>
              <div className="mt-2 text-3xl font-semibold text-white">{animals.length}</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="text-sm text-emerald-300">Friska</div>
              <div className="mt-2 text-3xl font-semibold text-white">{healthyAnimals.length}</div>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="text-sm text-amber-300">Bevakning</div>
              <div className="mt-2 text-3xl font-semibold text-white">{watchlistAnimals.length}</div>
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="text-sm text-red-300">Kritiska</div>
              <div className="mt-2 text-3xl font-semibold text-white">{criticalAnimals.length}</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="Senaste djuren">
            <div className="space-y-3">
              {animals.slice(0, 5).map((animal) => (
                <div
                  key={animal.id}
                  className="rounded-2xl border border-white/10 bg-[#0a1320] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-white">{animal.name}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {animal.earTag || 'Inget öronmärke'} · {animal.barn || 'Ingen plats'}
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-sm ${animalStatusClass(animal.status)}`}>
                      {animalStatusLabel(animal.status)}
                    </span>
                  </div>
                </div>
              ))}
              {animals.length === 0 && <div className="text-slate-400">Inga djur ännu.</div>}
            </div>
          </Card>

          <Card title="Senaste uppgifterna">
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-white/10 bg-[#0a1320] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-white">{task.title}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {task.owner || 'Ingen ansvarig'} · {task.due || 'Ingen tid'}
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-sm ${taskStatusClass(task.status)}`}>
                      {taskStatusLabel(task.status)}
                    </span>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div className="text-slate-400">Inga uppgifter ännu.</div>}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  function renderAnimals() {
    return (
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <Card title={editingAnimalId ? 'Redigera djur' : 'Lägg till djur'}>
          <form onSubmit={handleAnimalSubmit} className="grid gap-4 md:grid-cols-2">
            <input
              value={animalForm.name}
              onChange={(e) => setAnimalForm((v) => ({ ...v, name: e.target.value }))}
              placeholder="Namn"
              required
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <input
              value={animalForm.earTag}
              onChange={(e) => setAnimalForm((v) => ({ ...v, earTag: e.target.value }))}
              placeholder="Öronmärke"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <input
              value={animalForm.barn}
              onChange={(e) => setAnimalForm((v) => ({ ...v, barn: e.target.value }))}
              placeholder="Ladugård"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <input
              value={animalForm.group}
              onChange={(e) => setAnimalForm((v) => ({ ...v, group: e.target.value }))}
              placeholder="Grupp"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <input
              value={animalForm.battery}
              onChange={(e) => setAnimalForm((v) => ({ ...v, battery: e.target.value }))}
              placeholder="Batteri"
              type="number"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <input
              value={animalForm.assignedTo}
              onChange={(e) => setAnimalForm((v) => ({ ...v, assignedTo: e.target.value }))}
              placeholder="Ansvarig"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <select
              value={animalForm.status}
              onChange={(e) => setAnimalForm((v) => ({ ...v, status: e.target.value as AnimalStatus }))}
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            >
              <option value="healthy">Frisk</option>
              <option value="watchlist">Bevakning</option>
              <option value="critical">Kritisk</option>
            </select>
            <select
              value={animalForm.priority}
              onChange={(e) => setAnimalForm((v) => ({ ...v, priority: e.target.value as AnimalPriority }))}
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            >
              <option value="Hög">Hög</option>
              <option value="Medel">Medel</option>
              <option value="Låg">Låg</option>
            </select>
            <input
              value={animalForm.lastObservation}
              onChange={(e) => setAnimalForm((v) => ({ ...v, lastObservation: e.target.value }))}
              placeholder="Senaste observation"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none md:col-span-2"
            />
            <textarea
              value={animalForm.deviation}
              onChange={(e) => setAnimalForm((v) => ({ ...v, deviation: e.target.value }))}
              placeholder="Avvikelse"
              className="min-h-[120px] rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none md:col-span-2"
            />

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={savingAnimal}
                className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-3 text-[#eddcb8]"
              >
                {savingAnimal ? 'Sparar...' : editingAnimalId ? 'Uppdatera djur' : 'Skapa djur'}
              </button>

              <button
                type="button"
                onClick={resetAnimalForm}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300"
              >
                Rensa
              </button>
            </div>
          </form>
        </Card>

        <Card
          title="Djurlista"
          right={
            <div className="flex flex-wrap gap-2">
              <SectionButton
                active={animalFilter === 'all'}
                label="Alla"
                onClick={() => setAnimalFilter('all')}
              />
              <SectionButton
                active={animalFilter === 'healthy'}
                label="Friska"
                onClick={() => setAnimalFilter('healthy')}
              />
              <SectionButton
                active={animalFilter === 'watchlist'}
                label="Bevakning"
                onClick={() => setAnimalFilter('watchlist')}
              />
              <SectionButton
                active={animalFilter === 'critical'}
                label="Kritiska"
                onClick={() => setAnimalFilter('critical')}
              />
            </div>
          }
        >
          <div className="mb-4">
            <SearchInput
              value={animalSearch}
              onChange={setAnimalSearch}
              placeholder="Sök djur, öronmärke, grupp, ansvarig eller avvikelse"
            />
          </div>

          <div className="space-y-3">
            {animalsLoading && <div className="text-slate-400">Laddar djur...</div>}

            {!animalsLoading && filteredAnimals.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4 text-slate-400">
                Inga djur hittades.
              </div>
            )}

            {filteredAnimals.map((animal) => (
              <div
                key={animal.id}
                className={`rounded-3xl border p-5 ${
                  selectedAnimalId === animal.id
                    ? 'border-[#c8a96b]/30 bg-[#c8a96b]/10'
                    : 'border-white/10 bg-[#0a1320]'
                }`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div
                    className="cursor-pointer"
                    onClick={() => setSelectedAnimalId(animal.id)}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xl font-semibold text-white">{animal.name}</div>
                      <span className={`rounded-full border px-3 py-1 text-sm ${animalStatusClass(animal.status)}`}>
                        {animalStatusLabel(animal.status)}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-slate-400">
                      {animal.earTag || '–'} · {animal.barn || '–'} · {animal.group || '–'}
                    </div>

                    <div className="mt-3 text-slate-200">
                      {animal.deviation || 'Ingen avvikelse registrerad'}
                    </div>

                    <div className="mt-2 text-sm text-slate-400">
                      Senaste observation: {animal.lastObservation || '–'}
                    </div>
                  </div>

                  <div className="min-w-[220px] space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Batteri</div>
                      <div className="mt-1 text-3xl font-semibold text-white">{animal.battery}%</div>
                      <div className="mt-2 text-sm text-slate-400">
                        Ansvarig: {animal.assignedTo || '–'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startEditAnimal(animal)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
                      >
                        Redigera
                      </button>
                      <button
                        onClick={() => handleDeleteAnimal(animal.id)}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedAnimal && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Valt djur</div>
              <div className="mt-2 text-2xl font-semibold text-white">{selectedAnimal.name}</div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <div>Öronmärke: {selectedAnimal.earTag || '–'}</div>
                <div>Ladugård: {selectedAnimal.barn || '–'}</div>
                <div>Grupp: {selectedAnimal.group || '–'}</div>
                <div>Ansvarig: {selectedAnimal.assignedTo || '–'}</div>
                <div>Prioritet: {selectedAnimal.priority}</div>
                <div>Batteri: {selectedAnimal.battery}%</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    )
  }

  function renderTasks() {
    return (
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <Card title={editingTaskId ? 'Redigera uppgift' : 'Skapa uppgift'}>
          <form onSubmit={handleTaskSubmit} className="grid gap-4 md:grid-cols-2">
            <input
              value={taskForm.title}
              onChange={(e) => setTaskForm((v) => ({ ...v, title: e.target.value }))}
              placeholder="Titel"
              required
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none md:col-span-2"
            />
            <input
              value={taskForm.owner}
              onChange={(e) => setTaskForm((v) => ({ ...v, owner: e.target.value }))}
              placeholder="Ansvarig"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <input
              value={taskForm.due}
              onChange={(e) => setTaskForm((v) => ({ ...v, due: e.target.value }))}
              placeholder="Deadline, t.ex. Idag 14:00"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <input
              value={taskForm.relatedTo}
              onChange={(e) => setTaskForm((v) => ({ ...v, relatedTo: e.target.value }))}
              placeholder="Relaterat till, t.ex. Rosa 14"
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            />
            <select
              value={taskForm.status}
              onChange={(e) => setTaskForm((v) => ({ ...v, status: e.target.value as TaskStatus }))}
              className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
            >
              <option value="today">Idag</option>
              <option value="upcoming">Kommande</option>
              <option value="overdue">Försenad</option>
              <option value="done">Klar</option>
            </select>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={savingTask}
                className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-3 text-[#eddcb8]"
              >
                {savingTask ? 'Sparar...' : editingTaskId ? 'Uppdatera uppgift' : 'Skapa uppgift'}
              </button>

              <button
                type="button"
                onClick={resetTaskForm}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300"
              >
                Rensa
              </button>

              {selectedAnimal && (
                <button
                  type="button"
                  onClick={() =>
                    setTaskForm((v) => ({
                      ...v,
                      relatedTo: selectedAnimal.name,
                      owner: selectedAnimal.assignedTo || v.owner,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300"
                >
                  Fyll från valt djur
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card title="Uppgiftslista">
          <div className="mb-4">
            <SearchInput
              value={taskSearch}
              onChange={setTaskSearch}
              placeholder="Sök titel, ansvarig, deadline eller koppling"
            />
          </div>

          <div className="space-y-3">
            {tasksLoading && <div className="text-slate-400">Laddar uppgifter...</div>}

            {!tasksLoading && filteredTasks.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4 text-slate-400">
                Inga uppgifter hittades.
              </div>
            )}

            {filteredTasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className={`text-white ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                      {task.title}
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      {task.owner || 'Ingen ansvarig'} · {task.due || 'Ingen deadline'}
                      {task.relatedTo ? ` · ${task.relatedTo}` : ''}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-sm ${taskStatusClass(task.status)}`}>
                      {taskStatusLabel(task.status)}
                    </span>

                    <button
                      onClick={() => handleToggleTaskDone(task)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
                    >
                      {task.status === 'done' ? 'Återöppna' : 'Klarmarkera'}
                    </button>

                    <button
                      onClick={() => startEditTask(task)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
                    >
                      Redigera
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#08111d] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Bionimal Pulse</div>
          <h1 className="mt-2 text-3xl font-semibold text-white">Farm OS</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Riktig driftvy där kunden själv kan registrera, uppdatera och ta bort djur och uppgifter.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <SectionButton
            active={activeSection === 'overview'}
            label="Översikt"
            onClick={() => setActiveSection('overview')}
          />
          <SectionButton
            active={activeSection === 'animals'}
            label="Djur"
            onClick={() => setActiveSection('animals')}
          />
          <SectionButton
            active={activeSection === 'tasks'}
            label="Uppgifter"
            onClick={() => setActiveSection('tasks')}
          />
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            {errorMessage}
          </div>
        )}

        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'animals' && renderAnimals()}
        {activeSection === 'tasks' && renderTasks()}

        <div className="mt-8 rounded-[2rem] border border-[#c8a96b]/20 bg-[#c8a96b]/10 p-6 text-[#eddcb8]">
          Nästa steg: bygg samma riktiga CRUD-flöde för leverantörer, dokument, gårdslogg och sedan riktig mailintegration.
        </div>
      </div>
    </main>
  )
}
