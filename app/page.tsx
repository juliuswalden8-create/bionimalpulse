'use client'

import { useMemo, useState } from 'react'

type AnimalStatus = 'healthy' | 'watchlist' | 'critical'
type MailCategory =
  | 'Veterinär'
  | 'Leverantör'
  | 'Faktura'
  | 'Myndighet'
  | 'Personal'
  | 'Transport'
type TaskStatus = 'today' | 'upcoming' | 'overdue' | 'done'
type DocumentType = 'Faktura' | 'Avtal' | 'Journal' | 'Försäkring' | 'Service'
type LogSeverity = 'info' | 'warning' | 'critical'

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
  priority: 'Hög' | 'Medel' | 'Låg'
  assignedTo: string
}

type InboxMail = {
  id: string
  from: string
  subject: string
  preview: string
  category: MailCategory
  receivedAt: string
  unread: boolean
  important: boolean
}

type FarmTask = {
  id: string
  title: string
  owner: string
  due: string
  status: TaskStatus
  relatedTo?: string
}

type FarmDocument = {
  id: string
  name: string
  type: DocumentType
  linkedTo: string
  updatedAt: string
  source: string
}

type FarmLog = {
  id: string
  time: string
  title: string
  detail: string
  severity: LogSeverity
}

type Supplier = {
  id: string
  name: string
  category: string
  contact: string
  nextAction: string
}

const animalsSeed: Animal[] = [
  {
    id: 'a1',
    name: 'Rosa 14',
    earTag: 'SE-10234',
    barn: 'Ladugård A',
    group: 'Mjölkande',
    battery: 8,
    status: 'critical',
    deviation: 'Avvikande låg aktivitet senaste 10 timmarna',
    lastObservation: 'Står avskilt mer än normalt',
    priority: 'Hög',
    assignedTo: 'Anna',
  },
  {
    id: 'a2',
    name: 'Maja 08',
    earTag: 'SE-10218',
    barn: 'Ladugård A',
    group: 'Mjölkande',
    battery: 24,
    status: 'watchlist',
    deviation: 'Rörelsemönster under normalnivå',
    lastObservation: 'Lite långsammare till foderplats',
    priority: 'Hög',
    assignedTo: 'Johan',
  },
  {
    id: 'a3',
    name: 'Bella 22',
    earTag: 'SE-10278',
    barn: 'Ladugård B',
    group: 'Kvigor',
    battery: 92,
    status: 'healthy',
    deviation: 'Ingen avvikelse',
    lastObservation: 'Normal',
    priority: 'Låg',
    assignedTo: 'Anna',
  },
  {
    id: 'a4',
    name: 'Stjärna 03',
    earTag: 'SE-10191',
    barn: 'Ladugård A',
    group: 'Mjölkande',
    battery: 67,
    status: 'healthy',
    deviation: 'Ingen avvikelse',
    lastObservation: 'Normal',
    priority: 'Låg',
    assignedTo: 'Karin',
  },
  {
    id: 'a5',
    name: 'Freja 31',
    earTag: 'SE-10301',
    barn: 'Ladugård C',
    group: 'Sinkor',
    battery: 17,
    status: 'watchlist',
    deviation: 'Batteri lågt och mindre aktivitet än normalt',
    lastObservation: 'Behöver kollas visuellt idag',
    priority: 'Medel',
    assignedTo: 'Johan',
  },
  {
    id: 'a6',
    name: 'Luna 11',
    earTag: 'SE-10211',
    barn: 'Ladugård B',
    group: 'Kvigor',
    battery: 88,
    status: 'healthy',
    deviation: 'Ingen avvikelse',
    lastObservation: 'Normal',
    priority: 'Låg',
    assignedTo: 'Karin',
  },
]

const inboxSeed: InboxMail[] = [
  {
    id: 'm1',
    from: 'Distriktsveterinärerna',
    subject: 'Återkoppling på provsvar för Rosa 14',
    preview: 'Vi rekommenderar uppföljning inom 24 timmar om beteendet kvarstår.',
    category: 'Veterinär',
    receivedAt: '08:12',
    unread: true,
    important: true,
  },
  {
    id: 'm2',
    from: 'Lantmännen',
    subject: 'Bekräftelse på foderleverans torsdag',
    preview: 'Leveransen beräknas anlända mellan 07:00 och 09:00.',
    category: 'Leverantör',
    receivedAt: '07:45',
    unread: true,
    important: false,
  },
  {
    id: 'm3',
    from: 'Agria Försäkring',
    subject: 'Komplettering behövs i skadeärende',
    preview: 'Vi behöver ett uppdaterat underlag och en kort beskrivning av händelsen.',
    category: 'Myndighet',
    receivedAt: 'Igår',
    unread: false,
    important: true,
  },
  {
    id: 'm4',
    from: 'Svea Ekonomi',
    subject: 'Ny leverantörsfaktura att attestera',
    preview: 'Faktura 20481 för service av ventilationssystem.',
    category: 'Faktura',
    receivedAt: 'Igår',
    unread: true,
    important: true,
  },
  {
    id: 'm5',
    from: 'Transport Syd',
    subject: 'Ändrad upphämtningstid fredag',
    preview: 'Lastbilen kommer cirka 45 minuter senare än planerat.',
    category: 'Transport',
    receivedAt: 'Igår',
    unread: false,
    important: false,
  },
]

const tasksSeed: FarmTask[] = [
  {
    id: 't1',
    title: 'Kontrollera Rosa 14 manuellt i box',
    owner: 'Anna',
    due: 'Idag 10:30',
    status: 'today',
    relatedTo: 'Rosa 14',
  },
  {
    id: 't2',
    title: 'Svara veterinär om provsvar',
    owner: 'Johan',
    due: 'Idag 11:00',
    status: 'today',
  },
  {
    id: 't3',
    title: 'Attestera faktura för ventilationsservice',
    owner: 'Karin',
    due: 'Idag 14:00',
    status: 'today',
  },
  {
    id: 't4',
    title: 'Beställ nytt halsband till Freja 31',
    owner: 'Johan',
    due: 'Imorgon',
    status: 'upcoming',
    relatedTo: 'Freja 31',
  },
  {
    id: 't5',
    title: 'Följ upp foderleveransplan för torsdag',
    owner: 'Anna',
    due: 'Imorgon',
    status: 'upcoming',
  },
  {
    id: 't6',
    title: 'Skicka komplettering till försäkringsärende',
    owner: 'Karin',
    due: 'Försenad',
    status: 'overdue',
  },
]

const documentsSeed: FarmDocument[] = [
  {
    id: 'd1',
    name: 'Provsvar_Rosa14_Mars.pdf',
    type: 'Journal',
    linkedTo: 'Rosa 14',
    updatedAt: '08:20',
    source: 'Veterinärmail',
  },
  {
    id: 'd2',
    name: 'Faktura_Ventilation_20481.pdf',
    type: 'Faktura',
    linkedTo: 'Teknikbygg AB',
    updatedAt: 'Igår',
    source: 'Inkorg',
  },
  {
    id: 'd3',
    name: 'Försäkringsärende_Stallskada.pdf',
    type: 'Försäkring',
    linkedTo: 'Ladugård A',
    updatedAt: 'Igår',
    source: 'Agria',
  },
  {
    id: 'd4',
    name: 'Serviceprotokoll_Mjölkanläggning.pdf',
    type: 'Service',
    linkedTo: 'Mjölksystem',
    updatedAt: '2 dagar sedan',
    source: 'Tekniker',
  },
]

const logsSeed: FarmLog[] = [
  {
    id: 'l1',
    time: '09:14',
    title: 'Avvikelse upptäckt på Rosa 14',
    detail: 'Aktivitetsnivå under normalintervall och långvarigt stillastående.',
    severity: 'critical',
  },
  {
    id: 'l2',
    time: '08:48',
    title: 'Mail från veterinär mottaget',
    detail: 'Provsvar inkom och prioriterades automatiskt.',
    severity: 'warning',
  },
  {
    id: 'l3',
    time: '08:05',
    title: 'Ny faktura kategoriserad',
    detail: 'Ventilationsservice markerad för attest idag.',
    severity: 'info',
  },
  {
    id: 'l4',
    time: '07:52',
    title: 'Freja 31 lagd på bevakning',
    detail: 'Lågt batteri kombinerat med lägre aktivitet än 7-dagarsgenomsnitt.',
    severity: 'warning',
  },
]

const suppliersSeed: Supplier[] = [
  {
    id: 's1',
    name: 'Distriktsveterinärerna',
    category: 'Veterinär',
    contact: 'kontakt@vet.se',
    nextAction: 'Återkoppla om Rosa 14 före 11:00',
  },
  {
    id: 's2',
    name: 'Lantmännen',
    category: 'Foder',
    contact: 'kundservice@lantmannen.se',
    nextAction: 'Bekräfta torsdagens lossningstid',
  },
  {
    id: 's3',
    name: 'Teknikbygg AB',
    category: 'Service',
    contact: 'service@teknikbygg.se',
    nextAction: 'Attestera faktura och boka uppföljning',
  },
]

function statusPill(status: AnimalStatus) {
  if (status === 'healthy') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
  if (status === 'watchlist') return 'border-amber-500/20 bg-amber-500/10 text-amber-300'
  return 'border-red-500/20 bg-red-500/10 text-red-300'
}

function taskPill(status: TaskStatus) {
  if (status === 'today') return 'border-sky-500/20 bg-sky-500/10 text-sky-300'
  if (status === 'upcoming') return 'border-violet-500/20 bg-violet-500/10 text-violet-300'
  if (status === 'overdue') return 'border-red-500/20 bg-red-500/10 text-red-300'
  return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
}

function logPill(severity: LogSeverity) {
  if (severity === 'info') return 'bg-slate-500/10 text-slate-300 border-slate-400/20'
  if (severity === 'warning') return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
  return 'bg-red-500/10 text-red-300 border-red-500/20'
}

export default function Page() {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'animals' | 'inbox' | 'tasks' | 'documents' | 'log'
  >('overview')

  const [animals] = useState<Animal[]>(animalsSeed)
  const [inbox] = useState<InboxMail[]>(inboxSeed)
  const [tasks] = useState<FarmTask[]>(tasksSeed)
  const [documents] = useState<FarmDocument[]>(documentsSeed)
  const [logs] = useState<FarmLog[]>(logsSeed)
  const [suppliers] = useState<Supplier[]>(suppliersSeed)

  const criticalAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'critical'),
    [animals]
  )

  const watchlistAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'watchlist'),
    [animals]
  )

  const unreadMails = useMemo(() => inbox.filter((mail) => mail.unread), [inbox])
  const importantMails = useMemo(() => inbox.filter((mail) => mail.important), [inbox])
  const todayTasks = useMemo(() => tasks.filter((task) => task.status === 'today'), [tasks])
  const overdueTasks = useMemo(() => tasks.filter((task) => task.status === 'overdue'), [tasks])

  const avgBattery = useMemo(() => {
    const total = animals.reduce((sum, animal) => sum + animal.battery, 0)
    return Math.round(total / animals.length)
  }, [animals])

  return (
    <main className="min-h-screen bg-[#08111d] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[290px] border-r border-white/10 bg-[#06101b] xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-8 py-7">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Bionimal Pulse
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">Farm OS</div>
            <p className="mt-3 text-sm text-slate-400">
              Samlat arbetsverktyg för djur, administration och kommunikation.
            </p>
          </div>

          <div className="flex-1 px-5 py-6">
            <div className="space-y-2">
              <button
                onClick={() => setActiveSection('overview')}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeSection === 'overview'
                    ? 'border border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
                    : 'text-slate-400'
                }`}
              >
                Översikt
              </button>

              <button
                onClick={() => setActiveSection('animals')}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeSection === 'animals'
                    ? 'border border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
                    : 'text-slate-400'
                }`}
              >
                Djur
              </button>

              <button
                onClick={() => setActiveSection('inbox')}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeSection === 'inbox'
                    ? 'border border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
                    : 'text-slate-400'
                }`}
              >
                Inkorg
              </button>

              <button
                onClick={() => setActiveSection('tasks')}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeSection === 'tasks'
                    ? 'border border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
                    : 'text-slate-400'
                }`}
              >
                Uppgifter
              </button>

              <button
                onClick={() => setActiveSection('documents')}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeSection === 'documents'
                    ? 'border border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
                    : 'text-slate-400'
                }`}
              >
                Dokument
              </button>

              <button
                onClick={() => setActiveSection('log')}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeSection === 'log'
                    ? 'border border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
                    : 'text-slate-400'
                }`}
              >
                Gårdslogg
              </button>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Dagens fokus
              </div>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                <div>• Kontrollera Rosa 14 manuellt</div>
                <div>• Svara veterinär</div>
                <div>• Attestera servicefaktura</div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Inkorg
              </div>
              <div className="mt-3 text-4xl font-semibold text-white">{unreadMails.length}</div>
              <div className="mt-2 text-sm text-slate-400">olästa mail</div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-white/10 bg-[#0a1523]/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Bondens operativa center
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-white">
                  Översikt över djur, administration och kommunikation
                </h1>
              </div>

              <div className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-2 text-sm text-[#eddcb8]">
                230 djur totalt · 1 kritisk avvikelse idag
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] px-6 py-8">
            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Aktiva djur</div>
                <div className="mt-4 text-5xl font-semibold text-white">{animals.length}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Kritiska</div>
                <div className="mt-4 text-5xl font-semibold text-red-400">{criticalAnimals.length}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Bevakning</div>
                <div className="mt-4 text-5xl font-semibold text-amber-400">{watchlistAnimals.length}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Olästa mail</div>
                <div className="mt-4 text-5xl font-semibold text-sky-400">{unreadMails.length}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c1726] p-6 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Snittbatteri</div>
                <div className="mt-4 text-5xl font-semibold text-white">{avgBattery}%</div>
              </div>
            </section>

            <section className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Prioriterade djur idag
                </div>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Det här behöver mest uppmärksamhet
                </h2>

                <div className="mt-6 space-y-4">
                  {animals
                    .filter((animal) => animal.priority !== 'Låg')
                    .map((animal) => (
                      <div
                        key={animal.id}
                        className="rounded-3xl border border-white/10 bg-[#0a1320] p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="text-xl font-semibold text-white">{animal.name}</div>
                              <span
                                className={`rounded-full border px-3 py-1 text-sm ${statusPill(animal.status)}`}
                              >
                                {animal.status === 'healthy'
                                  ? 'Frisk'
                                  : animal.status === 'watchlist'
                                  ? 'Bevakning'
                                  : 'Kritisk'}
                              </span>
                            </div>

                            <div className="mt-3 text-sm text-slate-400">
                              {animal.earTag} · {animal.barn} · {animal.group}
                            </div>

                            <div className="mt-3 text-slate-200">{animal.deviation}</div>
                            <div className="mt-2 text-sm text-slate-400">
                              Senaste observation: {animal.lastObservation}
                            </div>
                          </div>

                          <div className="min-w-[180px] rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-sm text-slate-400">Batteri</div>
                            <div className="mt-1 text-3xl font-semibold text-white">
                              {animal.battery}%
                            </div>
                            <div className="mt-2 text-sm text-slate-400">
                              Ansvarig: {animal.assignedTo}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Dagens arbetslista
                </div>
                <h2 className="mt-2 text-3xl font-semibold text-white">Att göra</h2>

                <div className="mt-6 space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-white">{task.title}</div>
                          <div className="mt-2 text-sm text-slate-400">
                            {task.owner} · {task.due}
                            {task.relatedTo ? ` · ${task.relatedTo}` : ''}
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-sm ${taskPill(task.status)}`}
                        >
                          {task.status === 'today'
                            ? 'Idag'
                            : task.status === 'upcoming'
                            ? 'Kommande'
                            : task.status === 'overdue'
                            ? 'Försenad'
                            : 'Klar'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Inkorg</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Samlade viktiga mail
                </h2>

                <div className="mt-6 space-y-3">
                  {inbox.map((mail) => (
                    <div
                      key={mail.id}
                      className="rounded-2xl border border-white/10 bg-[#0a1320] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-white">{mail.subject}</div>
                            {mail.unread && (
                              <span className="rounded-full bg-sky-500/10 px-2 py-1 text-xs text-sky-300">
                                Oläst
                              </span>
                            )}
                            {mail.important && (
                              <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">
                                Viktigt
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-sm text-slate-400">
                            {mail.from} · {mail.category}
                          </div>
                          <div className="mt-2 text-slate-300">{mail.preview}</div>
                        </div>

                        <div className="whitespace-nowrap text-sm text-slate-500">
                          {mail.receivedAt}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Dokument och underlag
                </div>
                <h2 className="mt-2 text-3xl font-semibold text-white">Senaste dokument</h2>

                <div className="mt-6 space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-white">{doc.name}</div>
                          <div className="mt-2 text-sm text-slate-400">
                            {doc.type} · {doc.linkedTo} · Källa: {doc.source}
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">{doc.updatedAt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Gårdslogg
                </div>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Senaste händelser och åtgärder
                </h2>

                <div className="mt-6 space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-white/10 bg-[#0a1320] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-white">{log.title}</div>
                            <span className={`rounded-full border px-2 py-1 text-xs ${logPill(log.severity)}`}>
                              {log.severity === 'info'
                                ? 'Info'
                                : log.severity === 'warning'
                                ? 'Varning'
                                : 'Kritisk'}
                            </span>
                          </div>
                          <div className="mt-2 text-slate-300">{log.detail}</div>
                        </div>
                        <div className="text-sm text-slate-500">{log.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Leverantörer och kontakter
                </div>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Nästa administrativa steg
                </h2>

                <div className="mt-6 space-y-3">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="font-medium text-white">{supplier.name}</div>
                      <div className="mt-2 text-sm text-slate-400">
                        {supplier.category} · {supplier.contact}
                      </div>
                      <div className="mt-3 text-slate-300">{supplier.nextAction}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="mt-8 rounded-[2rem] border border-[#c8a96b]/20 bg-[#c8a96b]/10 p-6 text-[#eddcb8]">
              Nästa steg i produkten: koppla riktig mail, skapa uppgifter från mail automatiskt,
              koppla dokument till djur och bygg “dagens prioriteringar” från verkliga avvikelser.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}