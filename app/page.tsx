'use client'

import { useMemo, useState, type ReactNode } from 'react'

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
type Section = 'overview' | 'animals' | 'inbox' | 'tasks' | 'documents' | 'log'
type AnimalFilter = 'all' | AnimalStatus

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
  linkedAnimalId?: string
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
    linkedAnimalId: 'a1',
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
    relatedTo: 'Rosa 14',
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

const sectionLabels: Record<Section, string> = {
  overview: 'Översikt',
  animals: 'Djur',
  inbox: 'Inkorg',
  tasks: 'Uppgifter',
  documents: 'Dokument',
  log: 'Gårdslogg',
}

function getAnimalStatusLabel(status: AnimalStatus) {
  if (status === 'healthy') return 'Frisk'
  if (status === 'watchlist') return 'Bevakning'
  return 'Kritisk'
}

function getTaskStatusLabel(status: TaskStatus) {
  if (status === 'today') return 'Idag'
  if (status === 'upcoming') return 'Kommande'
  if (status === 'overdue') return 'Försenad'
  return 'Klar'
}

function getLogSeverityLabel(severity: LogSeverity) {
  if (severity === 'info') return 'Info'
  if (severity === 'warning') return 'Varning'
  return 'Kritisk'
}

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

function Sidebar({
  activeSection,
  setActiveSection,
  unreadCount,
}: {
  activeSection: Section
  setActiveSection: (section: Section) => void
  unreadCount: number
}) {
  const sections: Section[] = ['overview', 'animals', 'inbox', 'tasks', 'documents', 'log']

  return (
    <aside className="hidden w-[290px] border-r border-white/10 bg-[#06101b] xl:flex xl:flex-col">
      <div className="border-b border-white/10 px-8 py-7">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Bionimal Pulse</div>
        <div className="mt-2 text-2xl font-semibold text-white">Farm OS</div>
        <p className="mt-3 text-sm text-slate-400">
          Samlat arbetsverktyg för djur, administration och kommunikation.
        </p>
      </div>

      <div className="flex-1 px-5 py-6">
        <div className="space-y-2">
          {sections.map((section) => {
            const isActive = activeSection === section

            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                  isActive
                    ? 'border border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {sectionLabels[section]}
              </button>
            )
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Dagens fokus</div>
          <div className="mt-3 space-y-3 text-sm text-slate-300">
            <div>• Kontrollera Rosa 14 manuellt</div>
            <div>• Svara veterinär</div>
            <div>• Attestera servicefaktura</div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Inkorg</div>
          <div className="mt-3 text-4xl font-semibold text-white">{unreadCount}</div>
          <div className="mt-2 text-sm text-slate-400">olästa mail</div>
        </div>
      </div>
    </aside>
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
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </div>
  )
}

function FilterPills<T extends string>({
  value,
  onChange,
  options,
  labels,
}: {
  value: T
  onChange: (value: T) => void
  options: T[]
  labels: Record<T, string>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option === value

        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              isActive
                ? 'border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#eddcb8]'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {labels[option]}
          </button>
        )
      })}
    </div>
  )
}

function TopHeader({
  activeSection,
  totalAnimals,
  criticalCount,
}: {
  activeSection: Section
  totalAnimals: number
  criticalCount: number
}) {
  return (
    <header className="border-b border-white/10 bg-[#0a1523]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Bondens operativa center</div>
          <h1 className="mt-1 text-2xl font-semibold text-white">{sectionLabels[activeSection]}</h1>
        </div>

        <div className="rounded-2xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-2 text-sm text-[#eddcb8]">
          {totalAnimals} djur totalt · {criticalCount} kritisk avvikelse idag
        </div>
      </div>
    </header>
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

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0c1726] p-8 shadow-2xl">
      <div className="text-sm uppercase tracking-[0.24em] text-slate-500">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function AnimalsPanel({
  animals,
  onSelectAnimal,
  selectedAnimalId,
}: {
  animals: Animal[]
  onSelectAnimal: (animalId: string) => void
  selectedAnimalId?: string
}) {
  return (
    <SectionCard eyebrow="Djur" title="Alla djur och status">
      <div className="space-y-3">
        {animals.map((animal) => {
          const isSelected = selectedAnimalId === animal.id

          return (
            <button
              key={animal.id}
              onClick={() => onSelectAnimal(animal.id)}
              className={`w-full rounded-3xl border p-5 text-left transition ${
                isSelected
                  ? 'border-[#c8a96b]/30 bg-[#c8a96b]/10'
                  : 'border-white/10 bg-[#0a1320] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-semibold text-white">{animal.name}</div>
                    <span className={`rounded-full border px-3 py-1 text-sm ${statusPill(animal.status)}`}>
                      {getAnimalStatusLabel(animal.status)}
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
                  <div className="mt-1 text-3xl font-semibold text-white">{animal.battery}%</div>
                  <div className="mt-2 text-sm text-slate-400">Ansvarig: {animal.assignedTo}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}

function InboxPanel({
  inbox,
  animals,
  onToggleRead,
  onCreateTaskFromMail,
}: {
  inbox: InboxMail[]
  animals: Animal[]
  onToggleRead: (mailId: string) => void
  onCreateTaskFromMail: (mailId: string) => void
}) {
  return (
    <SectionCard eyebrow="Inkorg" title="Samlade viktiga mail">
      <div className="space-y-3">
        {inbox.map((mail) => {
          const linkedAnimal = animals.find((animal) => animal.id === mail.linkedAnimalId)

          return (
            <div key={mail.id} className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-medium text-white">{mail.subject}</div>
                    {mail.unread && (
                      <span className="rounded-full bg-sky-500/10 px-2 py-1 text-xs text-sky-300">Oläst</span>
                    )}
                    {mail.important && (
                      <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">Viktigt</span>
                    )}
                    {linkedAnimal && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                        Kopplat till {linkedAnimal.name}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-slate-400">{mail.from} · {mail.category}</div>
                  <div className="mt-2 text-slate-300">{mail.preview}</div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="whitespace-nowrap text-sm text-slate-500">{mail.receivedAt}</div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onToggleRead(mail.id)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      {mail.unread ? 'Markera läst' : 'Markera oläst'}
                    </button>
                    <button
                      onClick={() => onCreateTaskFromMail(mail.id)}
                      className="rounded-xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-3 py-2 text-sm text-[#eddcb8] transition hover:bg-[#c8a96b]/20"
                    >
                      Skapa uppgift
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

function TasksPanel({
  tasks,
  onToggleTaskDone,
}: {
  tasks: FarmTask[]
  onToggleTaskDone: (taskId: string) => void
}) {
  return (
    <SectionCard eyebrow="Uppgifter" title="Dagens arbetslista">
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`text-white ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                  {task.title}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  {task.owner} · {task.due}
                  {task.relatedTo ? ` · ${task.relatedTo}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-sm ${taskPill(task.status)}`}>
                  {getTaskStatusLabel(task.status)}
                </span>
                <button
                  onClick={() => onToggleTaskDone(task.id)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {task.status === 'done' ? 'Återställ' : 'Klarmarkera'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function DocumentsPanel({ documents }: { documents: FarmDocument[] }) {
  return (
    <SectionCard eyebrow="Dokument och underlag" title="Senaste dokument">
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
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
    </SectionCard>
  )
}

function LogsPanel({ logs }: { logs: FarmLog[] }) {
  return (
    <SectionCard eyebrow="Gårdslogg" title="Senaste händelser och åtgärder">
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="font-medium text-white">{log.title}</div>
                  <span className={`rounded-full border px-2 py-1 text-xs ${logPill(log.severity)}`}>
                    {getLogSeverityLabel(log.severity)}
                  </span>
                </div>
                <div className="mt-2 text-slate-300">{log.detail}</div>
              </div>
              <div className="text-sm text-slate-500">{log.time}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function SuppliersPanel({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <SectionCard eyebrow="Leverantörer och kontakter" title="Nästa administrativa steg">
      <div className="space-y-3">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium text-white">{supplier.name}</div>
            <div className="mt-2 text-sm text-slate-400">
              {supplier.category} · {supplier.contact}
            </div>
            <div className="mt-3 text-slate-300">{supplier.nextAction}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function AnimalDetailPanel({
  animal,
  relatedMails,
  relatedTasks,
  relatedDocuments,
  onCreateTaskFromAnimal,
}: {
  animal?: Animal
  relatedMails: InboxMail[]
  relatedTasks: FarmTask[]
  relatedDocuments: FarmDocument[]
  onCreateTaskFromAnimal: (animalId: string) => void
}) {
  if (!animal) {
    return (
      <SectionCard eyebrow="Djurdetalj" title="Välj ett djur">
        <div className="text-slate-400">
          Välj ett djur i listan för att se relaterade mail, uppgifter och dokument.
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard eyebrow="Djurdetalj" title={animal.name}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-sm ${statusPill(animal.status)}`}>
              {getAnimalStatusLabel(animal.status)}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
              {animal.earTag}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
              {animal.barn}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
            <div>Grupp: {animal.group}</div>
            <div>Ansvarig: {animal.assignedTo}</div>
            <div>Batteri: {animal.battery}%</div>
            <div>Prioritet: {animal.priority}</div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onCreateTaskFromAnimal(animal.id)}
              className="rounded-xl border border-[#c8a96b]/20 bg-[#c8a96b]/10 px-4 py-2 text-sm text-[#eddcb8] transition hover:bg-[#c8a96b]/20"
            >
              Skapa uppgift från avvikelse
            </button>
          </div>

          <div className="mt-4 text-slate-200">{animal.deviation}</div>
          <div className="mt-2 text-sm text-slate-400">Senaste observation: {animal.lastObservation}</div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
            <div className="text-sm uppercase tracking-[0.16em] text-slate-500">Relaterade mail</div>
            <div className="mt-4 space-y-3">
              {relatedMails.length === 0 ? (
                <div className="text-sm text-slate-400">Inga relaterade mail.</div>
              ) : (
                relatedMails.map((mail) => (
                  <div key={mail.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm font-medium text-white">{mail.subject}</div>
                    <div className="mt-1 text-xs text-slate-400">{mail.from}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
            <div className="text-sm uppercase tracking-[0.16em] text-slate-500">Relaterade uppgifter</div>
            <div className="mt-4 space-y-3">
              {relatedTasks.length === 0 ? (
                <div className="text-sm text-slate-400">Inga relaterade uppgifter.</div>
              ) : (
                relatedTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm font-medium text-white">{task.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{task.due}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1320] p-4">
            <div className="text-sm uppercase tracking-[0.16em] text-slate-500">Relaterade dokument</div>
            <div className="mt-4 space-y-3">
              {relatedDocuments.length === 0 ? (
                <div className="text-sm text-slate-400">Inga relaterade dokument.</div>
              ) : (
                relatedDocuments.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm font-medium text-white">{doc.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{doc.type}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

export default function Page() {
  const animals = animalsSeed
  const documents = documentsSeed
  const suppliers = suppliersSeed

  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('a1')
  const [inbox, setInbox] = useState<InboxMail[]>(inboxSeed)
  const [tasks, setTasks] = useState<FarmTask[]>(tasksSeed)
  const [logs, setLogs] = useState<FarmLog[]>(logsSeed)
  const [animalSearch, setAnimalSearch] = useState('')
  const [animalFilter, setAnimalFilter] = useState<AnimalFilter>('all')
  const [inboxSearch, setInboxSearch] = useState('')
  const [taskSearch, setTaskSearch] = useState('')

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

  const avgBattery = useMemo(() => {
    const total = animals.reduce((sum, animal) => sum + animal.battery, 0)
    return Math.round(total / animals.length)
  }, [animals])

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const matchesSearch = [animal.name, animal.earTag, animal.barn, animal.group, animal.assignedTo]
        .join(' ')
        .toLowerCase()
        .includes(animalSearch.toLowerCase())

      const matchesFilter = animalFilter === 'all' ? true : animal.status === animalFilter
      return matchesSearch && matchesFilter
    })
  }, [animals, animalFilter, animalSearch])

  const filteredInbox = useMemo(() => {
    return inbox.filter((mail) => {
      return [mail.subject, mail.from, mail.preview, mail.category]
        .join(' ')
        .toLowerCase()
        .includes(inboxSearch.toLowerCase())
    })
  }, [inbox, inboxSearch])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      return [task.title, task.owner, task.due, task.relatedTo ?? '']
        .join(' ')
        .toLowerCase()
        .includes(taskSearch.toLowerCase())
    })
  }, [taskSearch, tasks])

  const selectedAnimal = useMemo(
    () => animals.find((animal) => animal.id === selectedAnimalId),
    [animals, selectedAnimalId]
  )

  const relatedMails = useMemo(
    () => inbox.filter((mail) => mail.linkedAnimalId === selectedAnimalId),
    [inbox, selectedAnimalId]
  )

  const relatedTasks = useMemo(
    () => tasks.filter((task) => task.relatedTo === selectedAnimal?.name),
    [selectedAnimal, tasks]
  )

  const relatedDocuments = useMemo(
    () => documents.filter((doc) => doc.linkedTo === selectedAnimal?.name),
    [documents, selectedAnimal]
  )

  function addLog(entry: Omit<FarmLog, 'id'>) {
    setLogs((current) => [
      {
        id: `l${Date.now()}`,
        ...entry,
      },
      ...current,
    ])
  }

  function handleToggleRead(mailId: string) {
    setInbox((current) => {
      const target = current.find((mail) => mail.id === mailId)
      if (!target) return current

      const nextUnread = !target.unread
      const updated = current.map((mail) =>
        mail.id === mailId ? { ...mail, unread: nextUnread } : mail
      )

      addLog({
        time: 'Nu',
        title: nextUnread ? 'Mail markerat som oläst' : 'Mail markerat som läst',
        detail: target.subject,
        severity: 'info',
      })

      return updated
    })
  }

  function handleToggleTaskDone(taskId: string) {
    setTasks((current) => {
      const target = current.find((task) => task.id === taskId)
      if (!target) return current

      const nextStatus: TaskStatus = target.status === 'done' ? 'today' : 'done'
      const updated = current.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task
      )

      addLog({
        time: 'Nu',
        title: nextStatus === 'done' ? 'Uppgift klarmarkerad' : 'Uppgift återöppnad',
        detail: target.title,
        severity: nextStatus === 'done' ? 'info' : 'warning',
      })

      return updated
    })
  }

  function handleCreateTaskFromAnimal(animalId: string) {
    const animal = animals.find((entry) => entry.id === animalId)
    if (!animal) return

    const newTask: FarmTask = {
      id: `t${Date.now()}`,
      title: `Följ upp avvikelse för ${animal.name}`,
      owner: animal.assignedTo,
      due: 'Idag',
      status: 'today',
      relatedTo: animal.name,
    }

    setTasks((current) => [newTask, ...current])
    addLog({
      time: 'Nu',
      title: 'Ny uppgift skapad från djuravvikelse',
      detail: `${animal.name} lades till i arbetslistan.`,
      severity: animal.status === 'critical' ? 'critical' : 'warning',
    })
    setActiveSection('tasks')
  }

  function handleCreateTaskFromMail(mailId: string) {
    const mail = inbox.find((entry) => entry.id === mailId)
    if (!mail) return

    const linkedAnimal = animals.find((animal) => animal.id === mail.linkedAnimalId)
    const newTask: FarmTask = {
      id: `t${Date.now()}`,
      title: `Följ upp mail: ${mail.subject}`,
      owner: linkedAnimal?.assignedTo ?? 'Karin',
      due: 'Idag',
      status: 'today',
      relatedTo: linkedAnimal?.name,
    }

    setTasks((current) => [newTask, ...current])
    addLog({
      time: 'Nu',
      title: 'Ny uppgift skapad från mail',
      detail: mail.subject,
      severity: mail.important ? 'warning' : 'info',
    })
    setActiveSection('tasks')
  }

  function renderSection() {
    if (activeSection === 'animals') {
      return (
        <>
          <section className="mb-6 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
            <SearchInput
              value={animalSearch}
              onChange={setAnimalSearch}
              placeholder="Sök djur, öronmärke, ladugård eller ansvarig"
            />
            <FilterPills
              value={animalFilter}
              onChange={setAnimalFilter}
              options={['all', 'healthy', 'watchlist', 'critical']}
              labels={{
                all: 'Alla',
                healthy: 'Friska',
                watchlist: 'Bevakning',
                critical: 'Kritiska',
              }}
            />
          </section>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
            <AnimalsPanel
              animals={filteredAnimals}
              onSelectAnimal={setSelectedAnimalId}
              selectedAnimalId={selectedAnimalId}
            />
            <AnimalDetailPanel
              animal={selectedAnimal}
              relatedMails={relatedMails}
              relatedTasks={relatedTasks}
              relatedDocuments={relatedDocuments}
              onCreateTaskFromAnimal={handleCreateTaskFromAnimal}
            />
          </div>
        </>
      )
    }

    if (activeSection === 'inbox') {
      return (
        <>
          <section className="mb-6">
            <SearchInput
              value={inboxSearch}
              onChange={setInboxSearch}
              placeholder="Sök avsändare, ämne, kategori eller innehåll i mail"
            />
          </section>

          <InboxPanel
            inbox={filteredInbox}
            animals={animals}
            onToggleRead={handleToggleRead}
            onCreateTaskFromMail={handleCreateTaskFromMail}
          />
        </>
      )
    }

    if (activeSection === 'tasks') {
      return (
        <>
          <section className="mb-6">
            <SearchInput
              value={taskSearch}
              onChange={setTaskSearch}
              placeholder="Sök uppgift, ansvarig eller kopplat djur"
            />
          </section>

          <TasksPanel tasks={filteredTasks} onToggleTaskDone={handleToggleTaskDone} />
        </>
      )
    }

    if (activeSection === 'documents') {
      return <DocumentsPanel documents={documents} />
    }

    if (activeSection === 'log') {
      return (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_0.9fr]">
          <LogsPanel logs={logs} />
          <SuppliersPanel suppliers={suppliers} />
        </div>
      )
    }

    return (
      <>
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard title="Aktiva djur" value={animals.length} />
          <MetricCard title="Kritiska" value={criticalAnimals.length} valueClassName="text-red-400" />
          <MetricCard title="Bevakning" value={watchlistAnimals.length} valueClassName="text-amber-400" />
          <MetricCard title="Olästa mail" value={unreadMails.length} valueClassName="text-sky-400" />
          <MetricCard title="Viktiga mail" value={importantMails.length} valueClassName="text-[#eddcb8]" />
          <MetricCard title="Snittbatteri" value={`${avgBattery}%`} />
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard eyebrow="Prioriterade djur idag" title="Det här behöver mest uppmärksamhet">
            <div className="space-y-4">
              {animals
                .filter((animal) => animal.priority !== 'Låg')
                .map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => {
                      setSelectedAnimalId(animal.id)
                      setActiveSection('animals')
                    }}
                    className="w-full rounded-3xl border border-white/10 bg-[#0a1320] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="text-xl font-semibold text-white">{animal.name}</div>
                          <span className={`rounded-full border px-3 py-1 text-sm ${statusPill(animal.status)}`}>
                            {getAnimalStatusLabel(animal.status)}
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
                        <div className="mt-1 text-3xl font-semibold text-white">{animal.battery}%</div>
                        <div className="mt-2 text-sm text-slate-400">Ansvarig: {animal.assignedTo}</div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </SectionCard>

          <TasksPanel tasks={tasks} onToggleTaskDone={handleToggleTaskDone} />
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_1fr]">
          <InboxPanel
            inbox={inbox.slice(0, 4)}
            animals={animals}
            onToggleRead={handleToggleRead}
            onCreateTaskFromMail={handleCreateTaskFromMail}
          />
          <DocumentsPanel documents={documents} />
        </section>

        <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_0.9fr]">
          <LogsPanel logs={logs} />
          <SuppliersPanel suppliers={suppliers} />
        </section>
      </>
    )
  }

  return (
    <main className="min-h-screen bg-[#08111d] text-white">
      <div className="flex min-h-screen">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          unreadCount={unreadMails.length}
        />

        <div className="flex-1">
          <TopHeader
            activeSection={activeSection}
            totalAnimals={animals.length}
            criticalCount={criticalAnimals.length}
          />

          <div className="mx-auto max-w-[1600px] px-6 py-8">
            {renderSection()}

            <div className="mt-8 rounded-[2rem] border border-[#c8a96b]/20 bg-[#c8a96b]/10 p-6 text-[#eddcb8]">
              Nästa steg i produkten: koppla riktig mail, skapa uppgifter från mail automatiskt,
              koppla dokument till djur och bygg dagens prioriteringar från verkliga avvikelser.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

