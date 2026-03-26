'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AnimalStatus = 'healthy' | 'watchlist' | 'critical'
type NoteType = 'note' | 'health' | 'treatment' | 'check'
type FilterStatus = 'all' | AnimalStatus
type InboxProvider = 'gmail' | 'outlook' | 'imap'

type AppSection =
  | 'dashboard'
  | 'animals'
  | 'history'
  | 'tasks'
  | 'documents'
  | 'reports'
  | 'alerts'
  | 'inbox'
  | 'settings'

type DbAnimal = {
  id: string
  name: string | null
  ear_tag: string | null
  group_name: string | null
  status: string | null
  created_at: string | null
}

type DbNote = {
  id: string
  animal_id: string | null
  text: string | null
  type: string | null
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

type Note = {
  id: string
  animalId: string
  text: string
  type: NoteType
  createdAt: string | null
}

type Task = {
  id: string
  title: string
  owner: string
  due: string
  status: 'open' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
}

type DocumentItem = {
  id: string
  title: string
  category: string
  updatedAt: string
  owner: string
}

type AlertItem = {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

type InboxMessage = {
  id: string
  provider: InboxProvider
  fromName: string
  fromEmail: string
  subject: string
  preview: string
  receivedAt: string
  unread: boolean
  category: 'support' | 'operations' | 'finance' | 'general'
}

function normalizeStatus(value: string | null | undefined): AnimalStatus {
  if (value === 'healthy' || value === 'watchlist' || value === 'critical') {
    return value
  }
  return 'healthy'
}

function normalizeNoteType(value: string | null | undefined): NoteType {
  if (value === 'note' || value === 'health' || value === 'treatment' || value === 'check') {
    return value
  }
  return 'note'
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

function noteTypeLabel(type: NoteType) {
  switch (type) {
    case 'health':
      return 'Hälsa'
    case 'treatment':
      return 'Behandling'
    case 'check':
      return 'Kontroll'
    default:
      return 'Notering'
  }
}

function noteTypeClass(type: NoteType) {
  switch (type) {
    case 'health':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    case 'treatment':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-300'
    case 'check':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300'
    default:
      return 'border-white/10 bg-white/5 text-slate-300'
  }
}

function providerLabel(provider: InboxProvider) {
  switch (provider) {
    case 'gmail':
      return 'Gmail'
    case 'outlook':
      return 'Outlook'
    case 'imap':
      return 'IMAP'
    default:
      return 'Mail'
  }
}

function providerClass(provider: InboxProvider) {
  switch (provider) {
    case 'gmail':
      return 'border-red-500/20 bg-red-500/10 text-red-300'
    case 'outlook':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-300'
    case 'imap':
      return 'border-violet-500/20 bg-violet-500/10 text-violet-300'
    default:
      return 'border-white/10 bg-white/5 text-slate-300'
  }
}

function alertSeverityClass(severity: AlertItem['severity']) {
  switch (severity) {
    case 'low':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-300'
    case 'medium':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300'
    case 'high':
      return 'border-red-500/20 bg-red-500/10 text-red-300'
    default:
      return 'border-white/10 bg-white/5 text-slate-300'
  }
}

function taskStatusLabel(status: Task['status']) {
  switch (status) {
    case 'open':
      return 'Öppen'
    case 'in_progress':
      return 'Pågår'
    case 'done':
      return 'Klar'
    default:
      return 'Öppen'
  }
}

function taskPriorityClass(priority: Task['priority']) {
  switch (priority) {
    case 'low':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-300'
    case 'medium':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300'
    case 'high':
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function cardClassName() {
  return 'rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl'
}

function MetricCard({
  title,
  value,
  subtitle,
  valueClassName = 'text-white',
}: {
  title: string
  value: string | number
  subtitle?: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
      <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</div>
      <div className={`mt-4 text-4xl font-semibold ${valueClassName}`}>{value}</div>
      {subtitle ? <div className="mt-2 text-sm text-slate-400">{subtitle}</div> : null}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-[#0a1320] p-8 text-center">
      <div className="text-lg font-medium text-white">{text}</div>
    </div>
  )
}

function Sidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: AppSection
  onSectionChange: (section: AppSection) => void
}) {
  const navItems: { key: AppSection; label: string; hint: string }[] = [
    { key: 'dashboard', label: 'Dashboard', hint: 'Översikt' },
    { key: 'animals', label: 'Djur', hint: 'Register' },
    { key: 'history', label: 'Historik', hint: 'Noteringar' },
    { key: 'tasks', label: 'Uppgifter', hint: 'Att göra' },
    { key: 'documents', label: 'Dokument', hint: 'Filer' },
    { key: 'reports', label: 'Rapporter', hint: 'Nyckeltal' },
    { key: 'alerts', label: 'Aviseringar', hint: 'Händelser' },
    { key: 'inbox', label: 'Inbox', hint: 'Mail' },
    { key: 'settings', label: 'Inställningar', hint: 'System' },
  ]

  return (
    <aside className="hidden w-[310px] border-r border-white/10 bg-[#08111d] xl:flex xl:flex-col">
      <div className="border-b border-white/10 px-8 py-7">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Bionimal Pulse</div>
        <div className="mt-2 text-2xl font-semibold text-white">Farm Admin</div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Administrativ panel för drift, historik, dokument, rapporter och kommunikation.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const active = activeSection === item.key

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSectionChange(item.key)}
                className={
                  active
                    ? 'w-full rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-4 text-left'
                    : 'w-full rounded-2xl border border-transparent px-4 py-4 text-left transition hover:border-white/10 hover:bg-white/5'
                }
              >
                <div className={active ? 'text-[#eddcb8]' : 'text-white'}>{item.label}</div>
                <div className={active ? 'mt-1 text-xs text-[#eddcb8]/70' : 'mt-1 text-xs text-slate-500'}>
                  {item.hint}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Adminverktyg</div>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <div>• Driftpanel</div>
            <div>• Kommunikationsöversikt</div>
            <div>• Händelseloggar</div>
            <div>• Dokumentspårning</div>
            <div>• Rapporter och KPI</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function TopHeader({
  totalAnimals,
  activeSection,
}: {
  totalAnimals: number
  activeSection: AppSection
}) {
  const sectionTitles: Record<AppSection, string> = {
    dashboard: 'Dashboard',
    animals: 'Djur',
    history: 'Historik',
    tasks: 'Uppgifter',
    documents: 'Dokument',
    reports: 'Rapporter',
    alerts: 'Aviseringar',
    inbox: 'Inbox',
    settings: 'Inställningar',
  }

  return (
    <header className="border-b border-white/10 bg-[#0a1523]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1700px] items-center justify-between px-6 py-5">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Bondens operativa center
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-white">{sectionTitles[activeSection]}</h1>
        </div>

        <div className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-2 text-sm text-[#eddcb8]">
          {totalAnimals} djur registrerade
        </div>
      </div>
    </header>
  )
}

export default function Page() {
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard')

  const [animals, setAnimals] = useState<Animal[]>([])
  const [notes, setNotes] = useState<Note[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteSavingId, setNoteSavingId] = useState<string | null>(null)

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

  const [openNoteAnimalId, setOpenNoteAnimalId] = useState<string | null>(null)
  const [noteForm, setNoteForm] = useState({
    text: '',
    type: 'note' as NoteType,
  })

  const [inboxQuery, setInboxQuery] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Kontrollera ladugård 2',
      owner: 'John',
      due: '2026-03-28',
      status: 'open',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Följ upp kritiska djur',
      owner: 'Emma',
      due: '2026-03-29',
      status: 'in_progress',
      priority: 'high',
    },
    {
      id: '3',
      title: 'Uppdatera foderdokumentation',
      owner: 'Lucas',
      due: '2026-04-01',
      status: 'done',
      priority: 'medium',
    },
  ])

  const [documents] = useState<DocumentItem[]>([
    {
      id: '1',
      title: 'Veterinärprotokoll mars',
      category: 'Veterinär',
      updatedAt: '2026-03-25T08:15:00Z',
      owner: 'Emma',
    },
    {
      id: '2',
      title: 'Driftsrutin ladugård 1',
      category: 'Drift',
      updatedAt: '2026-03-24T12:30:00Z',
      owner: 'John',
    },
    {
      id: '3',
      title: 'Försäkringsunderlag Q1',
      category: 'Ekonomi',
      updatedAt: '2026-03-20T09:00:00Z',
      owner: 'Anna',
    },
  ])

  const [alerts] = useState<AlertItem[]>([
    {
      id: '1',
      title: 'Kritiskt djur registrerat',
      description: 'Ett djur har status Kritisk och bör följas upp idag.',
      severity: 'high',
    },
    {
      id: '2',
      title: 'Ny ekonomifråga i inbox',
      description: 'Ett nytt mail relaterat till faktura har kommit in.',
      severity: 'medium',
    },
    {
      id: '3',
      title: 'Rapport inte uppdaterad',
      description: 'Veckorapporten har inte uppdaterats de senaste 7 dagarna.',
      severity: 'low',
    },
  ])

  const [messages, setMessages] = useState<InboxMessage[]>([
    {
      id: '1',
      provider: 'gmail',
      fromName: 'Anna Svensson',
      fromEmail: 'anna@farmpartner.se',
      subject: 'Fråga om leverans till ladugård 2',
      preview:
        'Hej, vi vill stämma av leveransen och om ni kan ta emot på torsdag eftermiddag.',
      receivedAt: '2026-03-27T09:15:00Z',
      unread: true,
      category: 'operations',
    },
    {
      id: '2',
      provider: 'outlook',
      fromName: 'Johan Ekonomi',
      fromEmail: 'johan@bolag.se',
      subject: 'Faktura för mars',
      preview:
        'Här kommer fakturaunderlaget för mars. Återkom om något behöver justeras.',
      receivedAt: '2026-03-26T14:40:00Z',
      unread: false,
      category: 'finance',
    },
    {
      id: '3',
      provider: 'imap',
      fromName: 'Support',
      fromEmail: 'help@systemmail.com',
      subject: 'Nytt ärende registrerat',
      preview:
        'Ett nytt supportärende har registrerats och väntar på hantering.',
      receivedAt: '2026-03-26T11:10:00Z',
      unread: true,
      category: 'support',
    },
    {
      id: '4',
      provider: 'gmail',
      fromName: 'Driftchef Syd',
      fromEmail: 'drift@farmops.se',
      subject: 'Statusuppdatering från helgen',
      preview:
        'Vi har gjort en genomgång av samtliga sektioner och sammanställt de viktigaste avvikelserna.',
      receivedAt: '2026-03-25T18:05:00Z',
      unread: false,
      category: 'general',
    },
  ])

  async function loadAnimals() {
    const { data, error } = await supabase
      .from('animals')
      .select('id, name, ear_tag, group_name, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
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
  }

  async function loadNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('id, animal_id, text, type, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const mapped: Note[] = ((data ?? []) as DbNote[])
      .filter((note) => note.animal_id)
      .map((note) => ({
        id: note.id,
        animalId: note.animal_id as string,
        text: note.text ?? '',
        type: normalizeNoteType(note.type),
        createdAt: note.created_at ?? null,
      }))

    setNotes(mapped)
  }

  async function loadAll() {
    setLoading(true)
    setErrorMessage('')

    try {
      await Promise.all([loadAnimals(), loadNotes()])
    } catch (error: any) {
      console.error('loadAll error:', error)
      setErrorMessage(`Kunde inte hämta data: ${error.message}`)
      setAnimals([])
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  function resetForm() {
    setForm({
      name: '',
      earTag: '',
      groupName: '',
      status: 'healthy',
    })
  }

  function resetNoteForm() {
    setNoteForm({
      text: '',
      type: 'note',
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
      console.error('insert animal error:', error)
      setErrorMessage(`Kunde inte spara djuret: ${error.message}`)
      return
    }

    setSuccessMessage('Djuret sparades.')
    resetForm()
    await loadAll()
  }

  async function handleNoteSubmit(animalId: string) {
    setErrorMessage('')
    setSuccessMessage('')

    const text = noteForm.text.trim()

    if (!text) {
      setErrorMessage('Du måste skriva en notering.')
      return
    }

    setNoteSavingId(animalId)

    const payload = {
      animal_id: animalId,
      text,
      type: noteForm.type,
    }

    const { error } = await supabase.from('notes').insert([payload])

    setNoteSavingId(null)

    if (error) {
      console.error('insert note error:', error)
      setErrorMessage(`Kunde inte spara noteringen: ${error.message}`)
      return
    }

    setSuccessMessage('Noteringen sparades.')
    resetNoteForm()
    setOpenNoteAnimalId(null)
    await loadNotes()
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

  function getNotesForAnimal(animalId: string) {
    return notes.filter((note) => note.animalId === animalId)
  }

  const filteredMessages = useMemo(() => {
    const q = inboxQuery.trim().toLowerCase()

    return messages.filter((message) => {
      if (!q) return true

      return (
        message.subject.toLowerCase().includes(q) ||
        message.fromName.toLowerCase().includes(q) ||
        message.fromEmail.toLowerCase().includes(q) ||
        message.preview.toLowerCase().includes(q)
      )
    })
  }, [messages, inboxQuery])

  const selectedMessage =
    filteredMessages.find((message) => message.id === selectedMessageId) ??
    filteredMessages[0] ??
    null

  const unreadMessagesCount = messages.filter((message) => message.unread).length

  const totalNotes = notes.length
  const openTasks = tasks.filter((task) => task.status !== 'done').length
  const highAlerts = alerts.filter((alert) => alert.severity === 'high').length

  useEffect(() => {
    if (filteredMessages.length > 0 && !selectedMessageId) {
      setSelectedMessageId(filteredMessages[0].id)
    }
  }, [filteredMessages, selectedMessageId])

  return (
    <main className="min-h-screen bg-[#08111d] text-white">
      <div className="flex min-h-screen">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <div className="flex-1">
          <TopHeader totalAnimals={animals.length} activeSection={activeSection} />

          <div className="mx-auto max-w-[1700px] px-6 py-8">
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

            {activeSection === 'dashboard' ? (
              <div className="space-y-6">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard title="Djur totalt" value={animals.length} />
                  <MetricCard title="Friska" value={healthyCount} valueClassName="text-emerald-400" />
                  <MetricCard title="Bevakning" value={watchlistCount} valueClassName="text-amber-400" />
                  <MetricCard title="Kritiska" value={criticalCount} valueClassName="text-red-400" />
                  <MetricCard title="Olästa mail" value={unreadMessagesCount} valueClassName="text-blue-400" />
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  <div className={cardClassName()}>
                    <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Driftstatus</div>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Snabböversikt</h2>

                    <div className="mt-6 grid gap-4">
                      <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                        <div className="text-sm text-slate-500">Aktiva noteringar</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{totalNotes}</div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                        <div className="text-sm text-slate-500">Öppna uppgifter</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{openTasks}</div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                        <div className="text-sm text-slate-500">Högprioriterade aviseringar</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{highAlerts}</div>
                      </div>
                    </div>
                  </div>

                  <div className={cardClassName()}>
                    <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Inbox</div>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Senaste mail</h2>

                    <div className="mt-6 space-y-3">
                      {messages.slice(0, 4).map((message) => (
                        <div key={message.id} className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-white">{message.fromName}</div>
                            <span className={`rounded-full border px-3 py-1 text-xs ${providerClass(message.provider)}`}>
                              {providerLabel(message.provider)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-300">{message.subject}</div>
                          <div className="mt-2 text-xs text-slate-500">{formatDate(message.receivedAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cardClassName()}>
                    <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Prioriteringar</div>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Viktigt idag</h2>

                    <div className="mt-6 space-y-3">
                      {alerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full border px-3 py-1 text-xs ${alertSeverityClass(alert.severity)}`}>
                              {alert.severity === 'high'
                                ? 'Hög'
                                : alert.severity === 'medium'
                                ? 'Medel'
                                : 'Låg'}
                            </span>
                            <div className="text-sm font-medium text-white">{alert.title}</div>
                          </div>
                          <div className="mt-3 text-sm text-slate-400">{alert.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            ) : null}

            {activeSection === 'animals' ? (
              <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[0.85fr_1.15fr]">
                <div className={cardClassName()}>
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Registrering</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Lägg till djur</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Registrera namn, öronmärke, ladugård och status.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Namn"
                      required
                      className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    />

                    <input
                      value={form.earTag}
                      onChange={(e) => setForm((prev) => ({ ...prev, earTag: e.target.value }))}
                      placeholder="Öronmärke"
                      className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    />

                    <input
                      value={form.groupName}
                      onChange={(e) => setForm((prev) => ({ ...prev, groupName: e.target.value }))}
                      placeholder="Ladugård"
                      required
                      className="rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    />

                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, status: e.target.value as AnimalStatus }))
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

                <div className={cardClassName()}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Register</div>
                      <h2 className="mt-2 text-3xl font-semibold text-white">Sparade djur</h2>
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

                  <div className="mt-6 space-y-4">
                    {loading ? (
                      <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5 text-slate-400">
                        Laddar data...
                      </div>
                    ) : filteredAnimals.length === 0 ? (
                      <EmptyState text="Inga djur matchar just nu" />
                    ) : (
                      filteredAnimals.map((animal) => (
                        <div
                          key={animal.id}
                          className="rounded-3xl border border-white/10 bg-[#0a1320] p-5"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-xl font-semibold text-white">{animal.name}</div>
                            <span className={`rounded-full border px-3 py-1 text-sm ${statusClass(animal.status)}`}>
                              {statusLabel(animal.status)}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-1 text-sm text-slate-400">
                            <div>Öronmärke: {animal.earTag || '–'}</div>
                            <div>Ladugård: {animal.groupName || '–'}</div>
                            <div>Skapad: {formatDate(animal.createdAt)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            {activeSection === 'history' ? (
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
                <div className={cardClassName()}>
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Noteringar</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Lägg till historik</h2>

                  {animals.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-[#0a1320] p-5 text-slate-400">
                      Skapa minst ett djur först innan du lägger till noteringar.
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      <select
                        value={openNoteAnimalId ?? ''}
                        onChange={(e) => setOpenNoteAnimalId(e.target.value || null)}
                        className="w-full rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
                      >
                        <option value="">Välj djur</option>
                        {animals.map((animal) => (
                          <option key={animal.id} value={animal.id}>
                            {animal.name} — {animal.groupName || 'Ingen ladugård'}
                          </option>
                        ))}
                      </select>

                      <select
                        value={noteForm.type}
                        onChange={(e) =>
                          setNoteForm((prev) => ({
                            ...prev,
                            type: e.target.value as NoteType,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none"
                      >
                        <option value="note">Notering</option>
                        <option value="health">Hälsa</option>
                        <option value="treatment">Behandling</option>
                        <option value="check">Kontroll</option>
                      </select>

                      <textarea
                        value={noteForm.text}
                        onChange={(e) =>
                          setNoteForm((prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                        }
                        placeholder="Skriv en notering"
                        rows={5}
                        className="w-full rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                      />

                      <button
                        type="button"
                        onClick={() => openNoteAnimalId && handleNoteSubmit(openNoteAnimalId)}
                        disabled={!openNoteAnimalId || noteSavingId !== null}
                        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        {noteSavingId ? 'Sparar...' : 'Spara notering'}
                      </button>
                    </div>
                  )}
                </div>

                <div className={cardClassName()}>
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Historik</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Senaste noteringar</h2>

                  <div className="mt-6 space-y-3">
                    {notes.length === 0 ? (
                      <EmptyState text="Inga noteringar ännu" />
                    ) : (
                      notes.map((note) => {
                        const animal = animals.find((item) => item.id === note.animalId)

                        return (
                          <div key={note.id} className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`rounded-full border px-3 py-1 text-xs ${noteTypeClass(note.type)}`}>
                                {noteTypeLabel(note.type)}
                              </span>
                              <span className="text-xs text-slate-500">{formatDate(note.createdAt)}</span>
                            </div>

                            <div className="mt-3 text-sm font-medium text-white">
                              {animal?.name ?? 'Okänt djur'}
                            </div>

                            <div className="mt-2 text-sm leading-6 text-slate-300">{note.text}</div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            {activeSection === 'tasks' ? (
              <section className={cardClassName()}>
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Arbetsflöde</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">Uppgifter</h2>

                <div className="mt-6 grid gap-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-3xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">{task.title}</div>
                          <div className="mt-2 text-sm text-slate-400">
                            Ansvarig: {task.owner} • Deadline: {task.due}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <span className={`rounded-full border px-3 py-1 text-sm ${taskPriorityClass(task.priority)}`}>
                            {task.priority === 'high'
                              ? 'Hög'
                              : task.priority === 'medium'
                              ? 'Medel'
                              : 'Låg'}
                          </span>

                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
                            {taskStatusLabel(task.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeSection === 'documents' ? (
              <section className={cardClassName()}>
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Dokumenthantering</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">Dokument</h2>

                <div className="mt-6 grid gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-3xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">{doc.title}</div>
                          <div className="mt-2 text-sm text-slate-400">
                            Kategori: {doc.category} • Ansvarig: {doc.owner}
                          </div>
                        </div>

                        <div className="text-sm text-slate-500">
                          Uppdaterad: {formatDate(doc.updatedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeSection === 'reports' ? (
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className={cardClassName()}>
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">KPI</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Djurstatus</h2>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                      <div className="text-sm text-slate-500">Friska</div>
                      <div className="mt-2 text-3xl font-semibold text-emerald-400">{healthyCount}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                      <div className="text-sm text-slate-500">Bevakning</div>
                      <div className="mt-2 text-3xl font-semibold text-amber-400">{watchlistCount}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                      <div className="text-sm text-slate-500">Kritiska</div>
                      <div className="mt-2 text-3xl font-semibold text-red-400">{criticalCount}</div>
                    </div>
                  </div>
                </div>

                <div className={cardClassName()}>
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Kommunikation</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Inbox KPI</h2>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                      <div className="text-sm text-slate-500">Totala mail</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{messages.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                      <div className="text-sm text-slate-500">Olästa mail</div>
                      <div className="mt-2 text-3xl font-semibold text-blue-400">{unreadMessagesCount}</div>
                    </div>
                  </div>
                </div>

                <div className={cardClassName()}>
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Aktivitet</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Systemstatus</h2>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                      <div className="text-sm text-slate-500">Antal noteringar</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{notes.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
                      <div className="text-sm text-slate-500">Dokument</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{documents.length}</div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeSection === 'alerts' ? (
              <section className={cardClassName()}>
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Händelser</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">Aviseringar</h2>

                <div className="mt-6 space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="rounded-3xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs ${alertSeverityClass(alert.severity)}`}>
                          {alert.severity === 'high'
                            ? 'Hög'
                            : alert.severity === 'medium'
                            ? 'Medel'
                            : 'Låg'}
                        </span>
                        <div className="text-lg font-semibold text-white">{alert.title}</div>
                      </div>
                      <div className="mt-3 text-sm text-slate-400">{alert.description}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeSection === 'inbox' ? (
              <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[420px_1fr]">
                <div className={cardClassName()}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Kommunikation</div>
                      <h2 className="mt-2 text-3xl font-semibold text-white">Inbox</h2>
                    </div>

                    <div className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-2 text-sm text-[#eddcb8]">
                      {unreadMessagesCount} olästa
                    </div>
                  </div>

                  <input
                    value={inboxQuery}
                    onChange={(e) => setInboxQuery(e.target.value)}
                    placeholder="Sök mail"
                    className="mt-5 w-full rounded-2xl border border-white/10 bg-[#0a1320] px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />

                  <div className="mt-5 space-y-3">
                    {filteredMessages.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4 text-sm text-slate-400">
                        Inga mail hittades.
                      </div>
                    ) : (
                      filteredMessages.map((message) => {
                        const active = selectedMessage?.id === message.id

                        return (
                          <button
                            key={message.id}
                            type="button"
                            onClick={() => {
                              setSelectedMessageId(message.id)
                              setMessages((prev) =>
                                prev.map((item) =>
                                  item.id === message.id ? { ...item, unread: false } : item
                                )
                              )
                            }}
                            className={
                              active
                                ? 'w-full rounded-3xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 p-4 text-left'
                                : 'w-full rounded-3xl border border-white/10 bg-[#0a1320] p-4 text-left transition hover:bg-white/5'
                            }
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="truncate text-sm font-medium text-white">{message.fromName}</div>
                              {message.unread ? (
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                                  Nytt
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2 truncate text-sm text-slate-300">{message.subject}</div>
                            <div className="mt-2 text-sm text-slate-500">{message.preview}</div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span className={`rounded-full border px-3 py-1 text-xs ${providerClass(message.provider)}`}>
                                {providerLabel(message.provider)}
                              </span>
                              <span className="text-xs text-slate-500">{formatDate(message.receivedAt)}</span>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className={cardClassName()}>
                  {!selectedMessage ? (
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-6 text-slate-400">
                      Välj ett mail för att läsa innehållet.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs ${providerClass(selectedMessage.provider)}`}>
                          {providerLabel(selectedMessage.provider)}
                        </span>

                        {selectedMessage.unread ? (
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                            Oläst
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-4 text-3xl font-semibold text-white">{selectedMessage.subject}</h2>

                      <div className="mt-4 space-y-1 text-sm text-slate-400">
                        <div>
                          Från: {selectedMessage.fromName} ({selectedMessage.fromEmail})
                        </div>
                        <div>Mottaget: {formatDate(selectedMessage.receivedAt)}</div>
                        <div>Kategori: {selectedMessage.category}</div>
                      </div>

                      <div className="mt-6 rounded-3xl border border-white/10 bg-[#0a1320] p-6">
                        <p className="leading-7 text-slate-200">{selectedMessage.preview}</p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-5 py-3 text-[#eddcb8] transition hover:bg-[#c8a96b]/20"
                        >
                          Svara
                        </button>

                        <button
                          type="button"
                          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-slate-300 transition hover:bg-white/10"
                        >
                          Vidarebefordra
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setMessages((prev) =>
                              prev.map((item) =>
                                item.id === selectedMessage.id ? { ...item, unread: false } : item
                              )
                            )
                          }
                          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-slate-300 transition hover:bg-white/10"
                        >
                          Markera som läst
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </section>
            ) : null}

            {activeSection === 'settings' ? (
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className={cardClassName()}>
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">System</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Inställningar</h2>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="text-sm font-medium text-white">Mailintegrationer</div>
                      <div className="mt-2 text-sm text-slate-400">
                        Gmail, Outlook och IMAP visas just nu som mockdata i UI.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="text-sm font-medium text-white">Datakällor</div>
                      <div className="mt-2 text-sm text-slate-400">
                        Animals och notes hämtas från Supabase.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="text-sm font-medium text-white">Nästa steg</div>
                      <div className="mt-2 text-sm text-slate-400">
                        Lägg till riktig auth, rollhantering, edit/delete och live-mail via API.
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cardClassName()}>
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Admin</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Miljööversikt</h2>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="text-sm text-slate-500">Kopplade moduler</div>
                      <div className="mt-2 text-white">Djur, noteringar, inbox, dokument, uppgifter, rapporter</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="text-sm text-slate-500">Frontend</div>
                      <div className="mt-2 text-white">Next.js / React / Tailwind</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-5">
                      <div className="text-sm text-slate-500">Backend</div>
                      <div className="mt-2 text-white">Supabase för datalagring och policies</div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}
