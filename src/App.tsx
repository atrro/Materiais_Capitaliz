import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCopy,
  Download,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  History,
  CalendarDays,
  CalendarRange,
  GripVertical,
  Paperclip,
  MessageSquare,
  Filter,
  Printer,
  Send,
  Loader2,
  ChevronRight,
  ChevronDown,
  Upload,
  Database,
} from "lucide-react";
import {
  useProject,
  STATUS_LABEL,
  STATUS_ORDER,
  SCHEDULE_STATUS_LABEL,
  SCHEDULE_STATUS_ORDER,
  formatDateBR,
  splitResponsibles,
  type TaskStatus,
  type ScheduleStatus,
  type Meeting,
  type Attachment,
  type Task,
  parseBackup,
  downloadBackup,
} from "@/lib/project-store";
import {
  exportMeetingPdf,
  copyMeetingHtmlToClipboard,
  downloadMeetingHtml,
  copyTaskListHtmlToClipboard,
  exportSchedulePdf,
  downloadScheduleHtml,
  buildTimelineHtml,
  downloadTimelineHtml,
  exportTimelinePdf,
  exportTimelinePng,
  exportHistoryPdf,
  exportHistoryPng,
  downloadHistoryHtml,
  copyMinutesEmailHtml,
  downloadMinutesEmailHtml,
  exportMinutesEmailPdf,
  buildMinutesEmailHtml,
} from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const statusBadgeClass: Record<TaskStatus, string> = {
  finalizado: "bg-status-done text-status-done-fg",
  em_andamento: "bg-status-progress text-status-progress-fg",
  a_iniciar: "bg-status-todo text-status-todo-fg",
  caminho_critico: "bg-status-critical text-status-critical-fg",
};

const statusIcon: Record<TaskStatus, React.ReactNode> = {
  finalizado: <CheckCircle2 className="h-4 w-4" />,
  em_andamento: <Clock className="h-4 w-4" />,
  a_iniciar: <ListTodo className="h-4 w-4" />,
  caminho_critico: <AlertTriangle className="h-4 w-4" />,
};

const scheduleStatusColor: Record<ScheduleStatus, string> = {
  nao_iniciada: "#64748b",
  em_andamento: "#d69e2e",
  finalizada: "#2f855a",
  atrasada: "#c53030",
};

function statusColor(s: TaskStatus) {
  return {
    finalizado: "#2f855a",
    em_andamento: "#d69e2e",
    a_iniciar: "#3182ce",
    caminho_critico: "#c53030",
  }[s];
}

function SaveStatus({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-brand-foreground/90 bg-white/10 px-2.5 py-1 rounded-full">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Salvando…
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-brand-foreground/90 bg-white/10 px-2.5 py-1 rounded-full">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Salvado
    </div>
  );
}

function ExportAtaDialog({ p }: { p: ReturnType<typeof useProject> }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [greeting, setGreeting] = useState("Olá, bom dia");
  const [attendees, setAttendees] = useState("");
  const [sections, setSections] = useState({
    schedule: true,
    tasks: true,
    timeline: true,
    risks: true,
  });

  const opts = {
    date,
    greeting,
    attendees,
    includeSchedule: sections.schedule,
    includeTasks: sections.tasks,
    includeTimeline: sections.timeline,
    includeRisks: sections.risks,
  };

  const handleCopy = async () => {
    const ok = await copyMinutesEmailHtml(p.state, opts);
    toast[ok ? "success" : "error"](
      ok ? "Ata copiada! Cole no corpo do e-mail (Ctrl+V)." : "Não foi possível copiar.",
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Send className="h-4 w-4 mr-1" /> Exportar Ata
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Ata para e-mail</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Data da reunião</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Saudação</Label>
            <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Participantes</Label>
            <Input
              value={attendees}
              placeholder="Arthur, Vanusa, Brenno…"
              onChange={(e) => setAttendees(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {(
            [
              ["schedule", "Cronograma"],
              ["tasks", "To Do (Tarefas)"],
              ["timeline", "Priorização do To Do"],
              ["risks", "Riscos"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <Checkbox
                checked={sections[key]}
                onCheckedChange={(v) => setSections((s) => ({ ...s, [key]: !!v }))}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="rounded-md border bg-white p-4 overflow-auto max-h-[45vh]">
          <div dangerouslySetInnerHTML={{ __html: buildMinutesEmailHtml(p.state, opts) }} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => downloadMinutesEmailHtml(p.state, opts)}>
            <Download className="h-4 w-4 mr-1" /> Baixar HTML
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const id = toast.loading("Gerando PDF da ata...");
              try {
                await exportMinutesEmailPdf(p.state, opts);
                toast.success("PDF gerado.", { id });
              } catch (e) {
                console.error("exportMinutesEmailPdf", e);
                toast.error("Não foi possível gerar o PDF.", { id });
              }
            }}
          >
            <Download className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Button onClick={handleCopy}>
            <ClipboardCopy className="h-4 w-4 mr-1" /> Copiar para e-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BackupControls({ p }: { p: ReturnType<typeof useProject> }) {
  const { status, fileName, lastAt } = p.backup;
  if (p.server.enabled) {
    return (
      <p className="text-xs">
        {p.server.status === "error" ? (
          <span className="text-red-600">
            O servidor local não respondeu: as alterações estão só neste navegador. Feche esta janela e abra de novo
            pelo atalho <strong>Abrir-Materiais.bat</strong>.
          </span>
        ) : (
          <>
            Cada alteração é gravada em disco (pasta <strong>Programas-Locais\dados\materiais</strong>, com versões
            anteriores)
            {p.server.lastAt ? ` — última gravação ${new Date(p.server.lastAt).toLocaleTimeString("pt-BR")}` : ""}.
          </>
        )}
      </p>
    );
  }
  if (status === "unsupported") {
    return (
      <p className="text-xs text-muted-foreground">
        Este navegador não permite gravar em arquivo. Use o Chrome ou o Edge, ou baixe backups manualmente.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        A cada alteração, o painel grava os dados em um arquivo de sua escolha. Escolha uma pasta do
        OneDrive (ex.: Documentos): assim o backup sobrevive se os dados do navegador forem apagados.
      </p>
      {status === "active" && (
        <p className="text-xs">
          Ativo em <strong>{fileName}</strong>
          {lastAt ? ` — última gravação ${new Date(lastAt).toLocaleTimeString("pt-BR")}` : ""}
        </p>
      )}
      {status === "needs-permission" && (
        <p className="text-xs text-amber-600">
          O navegador pediu nova autorização para gravar em <strong>{fileName}</strong>.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {status === "needs-permission" && (
          <Button size="sm" onClick={p.reactivateBackup}>
            Reativar backup automático
          </Button>
        )}
        <Button size="sm" variant={status === "none" ? "default" : "outline"} onClick={p.setupBackup}>
          {status === "none" ? "Ativar backup automático" : "Trocar arquivo"}
        </Button>
        {status !== "none" && (
          <Button size="sm" variant="ghost" onClick={p.disableBackup}>
            Desativar
          </Button>
        )}
      </div>
    </div>
  );
}

function BackupBadge({ p }: { p: ReturnType<typeof useProject> }) {
  const { status } = p.backup;
  if (p.server.enabled) {
    const bad = p.server.status === "error";
    return (
      <div
        className={
          bad
            ? "inline-flex items-center gap-1.5 text-xs bg-red-500 text-white px-2.5 py-1 rounded-full"
            : "inline-flex items-center gap-1.5 text-xs text-brand-foreground/90 bg-white/10 px-2.5 py-1 rounded-full"
        }
      >
        {bad ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        {bad ? "Servidor local indisponível — não está gravando em disco" : "Salvo em disco"}
      </div>
    );
  }
  if (status === "unsupported") return null;
  if (status === "active") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-brand-foreground/90 bg-white/10 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Backup em arquivo ativo
      </div>
    );
  }
  return (
    <Button
      size="sm"
      variant="secondary"
      className="bg-amber-400 text-amber-950 hover:bg-amber-300"
      onClick={status === "needs-permission" ? p.reactivateBackup : p.setupBackup}
    >
      <AlertTriangle className="h-4 w-4 mr-1" />
      {status === "needs-permission" ? "Reativar backup automático" : "Ativar backup automático"}
    </Button>
  );
}

function BackupDialog({ p }: { p: ReturnType<typeof useProject> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseBackup(await file.text());
      if (!confirm("Substituir todos os dados atuais pelo conteúdo do backup?")) return;
      p.replaceState(parsed);
      toast.success("Backup restaurado.");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSyncNow = async () => {
    setLoading(true);
    try {
      await p.syncCloudNow();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-brand-foreground hover:bg-white/10">
          <Database className="h-4 w-4 mr-1" /> Dados
          {p.cloud.status === "error" && <span className="ml-2 h-2 w-2 rounded-full bg-amber-400" title="As alterações não estão sendo gravadas na nuvem" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Backup e importação de dados</DialogTitle>
        </DialogHeader>
        <div
          className={`rounded-md border p-3 text-sm ${
            p.cloud.status === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-green-300 bg-green-50 text-green-900"
          }`}
        >
          {p.cloud.status === "error" ? (
            <>
              <strong>Atenção:</strong> {p.cloud.error || "falha ao gravar na nuvem."} As alterações ficam neste navegador
              até a próxima sincronização.
            </>
          ) : p.cloud.status === "syncing" ? (
            <>Sincronizando com a nuvem…</>
          ) : (
            <>
              Os dados ficam na nuvem (criptografados) e aparecem para quem tem a senha do painel. Cada alteração é
              enviada na hora e as de colegas são mescladas
              {p.cloud.lastAt ? ` — última sincronização ${new Date(p.cloud.lastAt).toLocaleTimeString("pt-BR")}` : ""}.
            </>
          )}
        </div>
        <Button size="sm" onClick={handleSyncNow} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Sincronizar agora
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => downloadBackup(p.state)}>
            <Download className="h-4 w-4 mr-1" /> Baixar backup (.json)
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Restaurar backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
        <div className="space-y-2 border-t pt-4">
          <div className="text-sm font-medium">Backup automático em arquivo</div>
          <BackupControls p={p} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Shared tab context for cross-tab actions (card clicks apply filter and switch to Tasks)
type TasksFilters = {
  statuses: Set<TaskStatus>;
  responsibles: Set<string>;
};

export function ProjectApp() {
  const p = useProject();
  const [tab, setTab] = useState("tasks");
  const [tasksFilters, setTasksFilters] = useState<TasksFilters>({
    statuses: new Set(),
    responsibles: new Set(),
  });

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = {
      finalizado: 0,
      em_andamento: 0,
      a_iniciar: 0,
      caminho_critico: 0,
    };
    p.state.tasks.forEach((t) => (c[t.status] += 1));
    return c;
  }, [p.state.tasks]);

  const handleCardClick = (st: TaskStatus) => {
    setTasksFilters((f) => {
      const next = new Set(f.statuses);
      if (next.has(st) && next.size === 1) {
        next.clear();
      } else {
        next.clear();
        next.add(st);
      }
      return { ...f, statuses: next };
    });
    setTab("tasks");
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-brand text-brand-foreground">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">Painel de Projeto</div>
            <h1 className="text-2xl font-bold">{p.state.projectName}</h1>
            <div className="text-sm opacity-90">Gerente: {p.state.manager}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SaveStatus status={p.saveStatus} />
            <BackupBadge p={p} />
            <EditOverviewDialog project={p.state} onSave={p.updateOverview} />
            <ExportAtaDialog p={p} />
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-foreground hover:bg-white/10"
              onClick={p.resetAll}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
            </Button>
            <BackupDialog p={p} />

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUS_ORDER.map((st) => {
            const active = tasksFilters.statuses.has(st) && tab === "tasks";
            return (
              <button
                key={st}
                type="button"
                onClick={() => handleCardClick(st)}
                className="text-left"
              >
                <Card
                  className={
                    "border-l-4 transition cursor-pointer hover:shadow-md " +
                    (active ? "ring-2 ring-brand shadow-md" : "")
                  }
                  style={{ borderLeftColor: statusColor(st) }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        {STATUS_LABEL[st]}
                      </div>
                      <div className="text-2xl font-bold" suppressHydrationWarning>
                        {counts[st]}
                      </div>
                    </div>
                    <div style={{ color: statusColor(st) }}>{statusIcon[st]}</div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </section>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 md:w-fit">
            <TabsTrigger value="tasks">
              <ListTodo className="h-4 w-4 mr-1" /> Tarefas
            </TabsTrigger>
            <TabsTrigger value="meetings">
              <CalendarDays className="h-4 w-4 mr-1" /> FAQ
            </TabsTrigger>
            <TabsTrigger value="risks">
              <AlertTriangle className="h-4 w-4 mr-1" /> Riscos
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-1" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <CalendarRange className="h-4 w-4 mr-1" /> Cronograma
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="h-4 w-4 mr-1" /> Linha do tempo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <TasksTab p={p} filters={tasksFilters} setFilters={setTasksFilters} />
          </TabsContent>
          <TabsContent value="meetings" className="mt-4">
            <MeetingsTab p={p} />
          </TabsContent>
          <TabsContent value="risks" className="mt-4">
            <RisksTab p={p} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <HistoryTab p={p} />
          </TabsContent>
          <TabsContent value="schedule" className="mt-4">
            <ScheduleTab p={p} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <TimelineTab p={p} />
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visão geral</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground">
            {p.state.overview}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ---------- Multi-select filter popover ----------
function MultiSelectPopover<T extends string>({
  label,
  values,
  options,
  selected,
  onChange,
  width = 220,
}: {
  label: string;
  values: T[];
  options: Record<T, string> | ((v: T) => string);
  selected: Set<T>;
  onChange: (next: Set<T>) => void;
  width?: number;
}) {
  const labelFor = (v: T) => (typeof options === "function" ? options(v) : options[v]);
  const count = selected.size;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="h-4 w-4 mr-1" />
          {label}
          {count > 0 && (
            <Badge className="ml-2 bg-brand text-brand-foreground">{count}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent style={{ width }} className="p-2">
        <div className="flex items-center justify-between px-1 pb-2 border-b mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          {count > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => onChange(new Set())}
            >
              Limpar
            </Button>
          )}
        </div>
        <div className="max-h-64 overflow-auto space-y-1">
          {values.map((v) => (
            <label
              key={v}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
            >
              <Checkbox
                checked={selected.has(v)}
                onCheckedChange={(c) => {
                  const next = new Set(selected);
                  if (c) next.add(v);
                  else next.delete(v);
                  onChange(next);
                }}
              />
              <span>{labelFor(v)}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- Tasks ----------
function TasksTab({
  p,
  filters,
  setFilters,
}: {
  p: ReturnType<typeof useProject>;
  filters: TasksFilters;
  setFilters: React.Dispatch<React.SetStateAction<TasksFilters>>;
}) {
  const [sortBy, setSortBy] = useState<"manual" | "deadline_asc" | "deadline_desc">("manual");
  const filtered = p.state.tasks.filter((t) => {
    const okStatus =
      filters.statuses.size === 0 || filters.statuses.has(t.status);
    const okResp =
      filters.responsibles.size === 0 ||
      splitResponsibles(t.responsible).some((r) => filters.responsibles.has(r));
    return okStatus && okResp;
  });
  const list = sortBy === "manual"
    ? filtered
    : filtered.slice().sort((a, b) => {
        const ad = a.deadline || "9999-12-31";
        const bd = b.deadline || "9999-12-31";
        return sortBy === "deadline_asc" ? ad.localeCompare(bd) : bd.localeCompare(ad);
      });

  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base">Tarefas & Responsáveis</CardTitle>
        <div className="flex gap-2 items-center flex-wrap">
          <MultiSelectPopover
            label="Status"
            values={STATUS_ORDER}
            options={STATUS_LABEL}
            selected={filters.statuses}
            onChange={(next) => setFilters((f) => ({ ...f, statuses: next }))}
          />
          <MultiSelectPopover
            label="Responsável"
            values={p.state.responsibles}
            options={(r) => r}
            selected={filters.responsibles}
            onChange={(next) => setFilters((f) => ({ ...f, responsibles: next }))}
            width={240}
          />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Ordem manual</SelectItem>
              <SelectItem value="deadline_asc">Prazo (mais próximo)</SelectItem>
              <SelectItem value="deadline_desc">Prazo (mais distante)</SelectItem>
            </SelectContent>
          </Select>
          {(filters.statuses.size > 0 || filters.responsibles.size > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ statuses: new Set(), responsibles: new Set() })}
            >
              Limpar filtros
            </Button>
          )}
          <ManageResponsiblesDialog p={p} />
          <SendTaskListDialog p={p} />
          <TaskDialog
            responsibles={p.state.responsibles}
            onAddResponsible={p.addResponsible}
            onSave={(t) => p.addTask(t)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.length === 0 && (
          <div className="text-sm text-muted-foreground py-8 text-center">Nenhuma tarefa.</div>
        )}
        {list.map((t) => {
          const parts = splitResponsibles(t.responsible);
          const isDragTarget = dragId && dragId !== t.id;
          return (
            <div
              key={t.id}
              draggable
              onDragStart={(e) => {
                setDragId(t.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", t.id);
              }}
              onDragOver={(e) => {
                if (isDragTarget) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = e.dataTransfer.getData("text/plain") || dragId;
                if (from && from !== t.id) p.reorderTasks(from, t.id);
                setDragId(null);
              }}
              onDragEnd={() => setDragId(null)}
              className={
                "border rounded-lg p-3 flex flex-wrap items-start gap-3 hover:bg-muted/30 transition " +
                (dragId === t.id ? "opacity-40 " : "") +
                (isDragTarget ? "border-brand border-dashed " : "")
              }
            >
              <div
                className="cursor-grab active:cursor-grabbing text-muted-foreground pt-1"
                title="Arraste para reordenar"
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-[240px]">
                <div className="font-medium text-sm">{t.title}</div>
                <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">👤</span>
                  {parts.length === 0 && <span className="italic">Sem responsável</span>}
                  {parts.map((r) => (
                    <Badge
                      key={r}
                      variant="secondary"
                      className="font-normal text-[11px] py-0 h-5"
                    >
                      {r}
                    </Badge>
                  ))}
                  {t.deadline && <span className="ml-2">📅 {formatDateBR(t.deadline)}</span>}
                  {t.attachments && t.attachments.length > 0 && (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <Paperclip className="h-3 w-3" /> {t.attachments.length}
                    </span>
                  )}
                </div>
                {t.notes && <div className="text-xs mt-1 italic">{t.notes}</div>}
                {t.attachments && t.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.attachments.map((a) => (
                      <a
                        key={a.id}
                        href={a.dataUrl}
                        download={a.name}
                        className="text-[11px] inline-flex items-center gap-1 border rounded px-2 py-0.5 hover:bg-muted"
                        title={`${a.name} (${(a.size / 1024).toFixed(0)} KB)`}
                      >
                        <Paperclip className="h-3 w-3" /> {a.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <Badge className={statusBadgeClass[t.status] + " gap-1"}>
                {statusIcon[t.status]} {STATUS_LABEL[t.status]}
              </Badge>
              <Select
                value={t.status}
                onValueChange={(v) => {
                  p.updateTask(t.id, { status: v as TaskStatus });
                  p.addHistory(`Tarefa "${t.title}" → ${STATUS_LABEL[v as TaskStatus]}`);
                }}
              >
                <SelectTrigger className="w-[150px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TaskDialog
                existing={t}
                responsibles={p.state.responsibles}
                onAddResponsible={p.addResponsible}
                onSave={(patch) => {
                  p.updateTask(t.id, patch);
                  p.addHistory(`Tarefa editada: "${patch.title ?? t.title}"`);
                }}
              />
              <Button variant="ghost" size="icon" onClick={() => p.removeTask(t.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ---------- Task dialog with attachments ----------
function TaskDialog({
  existing,
  responsibles,
  onAddResponsible,
  onSave,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideTrigger,
}: {
  existing?: Task;
  responsibles: string[];
  onAddResponsible: (name: string) => void;
  onSave: (t: {
    title: string;
    responsible: string;
    status: TaskStatus;
    deadline?: string;
    notes?: string;
    attachments?: Attachment[];
  }) => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? !!openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (!controlled) setInternalOpen(v);
    onOpenChangeProp?.(v);
  };
  const [title, setTitle] = useState(existing?.title ?? "");
  const [selectedResps, setSelectedResps] = useState<string[]>(
    existing ? splitResponsibles(existing.responsible) : [],
  );
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? "a_iniciar");
  const [deadline, setDeadline] = useState(existing?.deadline ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(existing?.attachments ?? []);
  const [newResp, setNewResp] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleResp = (r: string) => {
    setSelectedResps((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const readFile = (f: File) =>
      new Promise<Attachment>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            id: Math.random().toString(36).slice(2, 10),
            name: f.name,
            size: f.size,
            type: f.type,
            dataUrl: String(reader.result),
          });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(f);
      });
    try {
      const added: Attachment[] = [];
      for (const f of Array.from(files)) {
        if (f.size > 4 * 1024 * 1024) {
          toast.error(`"${f.name}" excede 4 MB e não foi adicionado.`);
          continue;
        }
        added.push(await readFile(f));
      }
      setAttachments((a) => [...a, ...added]);
    } catch {
      toast.error("Falha ao ler anexo");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {existing ? (
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova tarefa
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[88vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Responsáveis</Label>
            <div className="border rounded-md p-2 max-h-40 overflow-auto space-y-1">
              {responsibles.length === 0 && (
                <div className="text-xs text-muted-foreground py-2 text-center">
                  Nenhum responsável cadastrado ainda.
                </div>
              )}
              {responsibles.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedResps.includes(r)}
                    onCheckedChange={() => toggleResp(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Cadastrar novo responsável…"
                value={newResp}
                onChange={(e) => setNewResp(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const n = newResp.trim();
                  if (!n) return;
                  onAddResponsible(n);
                  if (!selectedResps.includes(n)) setSelectedResps((s) => [...s, n]);
                  setNewResp("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea
              rows={14}
              className="min-h-[280px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <Label>Anexos</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-1" /> Adicionar arquivos
              </Button>
              <span className="text-xs text-muted-foreground">Máx. 4 MB por arquivo</span>
            </div>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between text-xs border rounded px-2 py-1"
                  >
                    <a href={a.dataUrl} download={a.name} className="hover:underline truncate">
                      📎 {a.name} · {(a.size / 1024).toFixed(0)} KB
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() =>
                        setAttachments((list) => list.filter((x) => x.id !== a.id))
                      }
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const responsible = selectedResps.join(" / ");
              if (!title.trim() || !responsible.trim()) {
                toast.error("Preencha título e ao menos um responsável");
                return;
              }
              onSave({
                title,
                responsible,
                status,
                deadline: deadline || undefined,
                notes,
                attachments,
              });
              setOpen(false);
              if (!existing) {
                setTitle("");
                setSelectedResps([]);
                setNotes("");
                setAttachments([]);
              }
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Manage Responsibles ----------
function ManageResponsiblesDialog({ p }: { p: ReturnType<typeof useProject> }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users className="h-4 w-4 mr-1" /> Responsáveis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Cadastro de responsáveis</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do responsável"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button
              onClick={() => {
                if (!newName.trim()) return;
                p.addResponsible(newName.trim());
                setNewName("");
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <ul className="space-y-2">
            {p.state.responsibles.map((r) => {
              const val = editing[r] ?? r;
              const dirty = val !== r;
              return (
                <li key={r} className="flex items-center gap-2 border rounded-md p-2">
                  <Input
                    value={val}
                    onChange={(e) => setEditing((s) => ({ ...s, [r]: e.target.value }))}
                    className="h-8"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!dirty || !val.trim()}
                    onClick={() => {
                      p.renameResponsible(r, val.trim());
                      setEditing((s) => {
                        const c = { ...s };
                        delete c[r];
                        return c;
                      });
                    }}
                  >
                    Salvar
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => p.removeResponsible(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              );
            })}
            {p.state.responsibles.length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhum responsável cadastrado.</li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Send task list (email copy) ----------
function SendTaskListDialog({ p }: { p: ReturnType<typeof useProject> }) {
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<Set<TaskStatus>>(new Set());
  const [resps, setResps] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<"status" | "responsavel">("responsavel");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Send className="h-4 w-4 mr-1" /> Copiar p/ e-mail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copiar tarefas para o corpo do e-mail</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <Label>Status (vazio = todos)</Label>
            <div className="border rounded-md p-2 space-y-1 mt-1">
              {STATUS_ORDER.map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <Checkbox
                    checked={statuses.has(s)}
                    onCheckedChange={(c) => {
                      const n = new Set(statuses);
                      if (c) n.add(s);
                      else n.delete(s);
                      setStatuses(n);
                    }}
                  />
                  <span>{STATUS_LABEL[s]}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Responsáveis (vazio = todos)</Label>
            <div className="border rounded-md p-2 max-h-40 overflow-auto space-y-1 mt-1">
              {p.state.responsibles.map((r) => (
                <label key={r} className="flex items-center gap-2">
                  <Checkbox
                    checked={resps.has(r)}
                    onCheckedChange={(c) => {
                      const n = new Set(resps);
                      if (c) n.add(r);
                      else n.delete(r);
                      setResps(n);
                    }}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Agrupar por</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "status" | "responsavel")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="responsavel">Responsável</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={async () => {
              const ok = await copyTaskListHtmlToClipboard(p.state, {
                statuses: Array.from(statuses),
                responsibles: Array.from(resps),
                groupBy,
              });
              toast[ok ? "success" : "error"](
                ok ? "Copiado — cole no corpo do e-mail" : "Falha ao copiar",
              );
              if (ok) setOpen(false);
            }}
          >
            <ClipboardCopy className="h-4 w-4 mr-1" /> Copiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Meetings ----------
function MeetingsTab({ p }: { p: ReturnType<typeof useProject> }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <MeetingDialog onSave={(m) => p.addMeeting(m)} />
      </div>
      {p.state.meetings.length === 0 && (
        <div className="text-sm text-muted-foreground py-8 text-center">Nenhuma ata registrada.</div>
      )}
      {p.state.meetings.map((m) => (
        <Card key={m.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{m.title}</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                {"\n"}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <ExportMeetingDialog meeting={m} p={p} />
              <MeetingDialog
                existing={m}
                onSave={(patch) => {
                  p.removeMeeting(m.id);
                  p.addMeeting({ ...m, ...patch });
                }}
              />
              <Button size="sm" variant="ghost" onClick={() => p.removeMeeting(m.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {m.summary && (
              <Section title="Resumo">
                <p className="whitespace-pre-wrap">{m.summary}</p>
              </Section>
            )}
            {m.decisions && (
              <Section title="Decisões">
                <BulletList text={m.decisions} />
              </Section>
            )}
            {m.followUp && (
              <Section title="Follow-up">
                <BulletList text={m.followUp} />
              </Section>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExportMeetingDialog({
  meeting,
  p,
}: {
  meeting: Meeting;
  p: ReturnType<typeof useProject>;
}) {
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<Set<TaskStatus>>(new Set(STATUS_ORDER));
  const [resps, setResps] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<"status" | "responsavel">("status");

  const opts = {
    statuses: Array.from(statuses),
    responsibles: Array.from(resps),
    groupBy,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FileText className="h-4 w-4 mr-1" /> Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar ata</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <Label>Status incluídos</Label>
            <div className="border rounded-md p-2 space-y-1 mt-1">
              {STATUS_ORDER.map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <Checkbox
                    checked={statuses.has(s)}
                    onCheckedChange={(c) => {
                      const n = new Set(statuses);
                      if (c) n.add(s);
                      else n.delete(s);
                      setStatuses(n);
                    }}
                  />
                  <span>{STATUS_LABEL[s]}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Responsáveis (vazio = todos)</Label>
            <div className="border rounded-md p-2 max-h-40 overflow-auto space-y-1 mt-1">
              {p.state.responsibles.map((r) => (
                <label key={r} className="flex items-center gap-2">
                  <Checkbox
                    checked={resps.has(r)}
                    onCheckedChange={(c) => {
                      const n = new Set(resps);
                      if (c) n.add(r);
                      else n.delete(r);
                      setResps(n);
                    }}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Classificar tarefas por</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "status" | "responsavel")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="responsavel">Responsável</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button onClick={() => exportMeetingPdf(meeting, p.state, opts)}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const ok = await copyMeetingHtmlToClipboard(meeting, p.state, opts);
              toast[ok ? "success" : "error"](
                ok ? "Ata copiada — cole no corpo do e-mail" : "Falha ao copiar",
              );
            }}
          >
            <ClipboardCopy className="h-4 w-4 mr-1" /> Copiar p/ e-mail
          </Button>
          <Button variant="outline" onClick={() => downloadMeetingHtml(meeting, p.state, opts)}>
            <Download className="h-4 w-4 mr-1" /> HTML
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-brand text-sm border-b-2 border-brand pb-1 mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const items = text.split(/\n+/).filter(Boolean);
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((i, idx) => (
        <li key={idx}>{i}</li>
      ))}
    </ul>
  );
}

function MeetingDialog({
  existing,
  onSave,
}: {
  existing?: Meeting;
  onSave: (m: Omit<Meeting, "id" | "createdAt">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(existing?.title ?? "");
  const [attendees, setAttendees] = useState(existing?.attendees ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [decisions, setDecisions] = useState(existing?.decisions ?? "");
  const [followUp, setFollowUp] = useState(existing?.followUp ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing ? (
          <Button size="sm" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Nova ata
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar ata" : "Nova ata de reunião"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Participantes</Label>
            <Input value={attendees} onChange={(e) => setAttendees(e.target.value)} />
          </div>
          <div>
            <Label>Resumo</Label>
            <Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div>
            <Label>Decisões (uma por linha)</Label>
            <Textarea rows={4} value={decisions} onChange={(e) => setDecisions(e.target.value)} />
          </div>
          <div>
            <Label>Follow-up (uma por linha)</Label>
            <Textarea rows={4} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!title.trim()) {
                toast.error("Informe o título");
                return;
              }
              onSave({ date, title, attendees, summary, decisions, followUp });
              setOpen(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Risks ----------
function RisksTab({ p }: { p: ReturnType<typeof useProject> }) {
  const [text, setText] = useState("");
  const open = p.state.risks.filter((r) => !r.resolved);
  const resolved = p.state.risks.filter((r) => r.resolved);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar risco / oportunidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Descrever novo risco ou oportunidade…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button
              onClick={() => {
                if (!text.trim()) return;
                p.addRisk(text.trim());
                setText("");
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warn" /> Riscos em aberto
            <Badge variant="outline">{open.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RiskList risks={open} p={p} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-done" /> Riscos resolvidos
            <Badge variant="outline">{resolved.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RiskList risks={resolved} p={p} resolvedView />
        </CardContent>
      </Card>
    </div>
  );
}

function RiskList({
  risks,
  p,
  resolvedView,
}: {
  risks: ReturnType<typeof useProject>["state"]["risks"];
  p: ReturnType<typeof useProject>;
  resolvedView?: boolean;
}) {
  if (risks.length === 0) {
    return <div className="text-sm text-muted-foreground py-3">Nenhum item.</div>;
  }
  return (
    <ul className="space-y-2">
      {risks.map((r, i) => (
        <RiskItem key={r.id} risk={r} idx={i + 1} p={p} resolvedView={!!resolvedView} />
      ))}
    </ul>
  );
}

function RiskItem({
  risk,
  idx,
  p,
  resolvedView,
}: {
  risk: ReturnType<typeof useProject>["state"]["risks"][number];
  idx: number;
  p: ReturnType<typeof useProject>;
  resolvedView: boolean;
}) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const commentCount = (risk.comments ?? []).length;

  return (
    <li className="border rounded-lg p-3 space-y-2 hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <Badge
          variant="outline"
          className={resolvedView ? "border-status-done text-status-done" : "border-warn text-warn"}
        >
          {idx}
        </Badge>
        <div className={"flex-1 text-sm " + (resolvedView ? "line-through opacity-70" : "")}>
          {risk.description}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments((v) => !v)}
          title="Comentários"
        >
          <MessageSquare className="h-4 w-4" />
          {commentCount > 0 && <span className="ml-1 text-xs">{commentCount}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => p.toggleRiskResolved(risk.id)}
          title={resolvedView ? "Reabrir" : "Marcar como resolvido"}
        >
          {resolvedView ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-status-done" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => p.removeRisk(risk.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {(showComments || commentCount > 0) && (
        <div className="pl-10 space-y-2">
          {(risk.comments ?? []).map((c) => (
            <div key={c.id} className="text-xs bg-muted/40 rounded p-2 flex items-start gap-2">
              <div className="flex-1">
                <div className="text-muted-foreground text-[10px]">
                  {formatDateBR(c.date.slice(0, 10))}
                </div>
                <div className="whitespace-pre-wrap">{c.text}</div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => p.removeRiskComment(risk.id, c.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Novo comentário…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={() => {
                if (!comment.trim()) return;
                p.addRiskComment(risk.id, comment.trim());
                setComment("");
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

// ---------- History ----------
function HistoryTab({ p }: { p: ReturnType<typeof useProject> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base">Histórico de alterações</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={async () => {
              try {
                await exportHistoryPdf(p.state);
                toast.success("PDF exportado");
              } catch (e) {
                console.error(e);
                toast.error("Falha ao exportar PDF");
              }
            }}
          >
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await exportHistoryPng(p.state);
                toast.success("PNG exportado");
              } catch (e) {
                console.error(e);
                toast.error("Falha ao exportar PNG");
              }
            }}
          >
            <Download className="h-4 w-4 mr-1" /> PNG
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadHistoryHtml(p.state);
              toast.success("HTML exportado");
            }}
          >
            <Download className="h-4 w-4 mr-1" /> HTML
          </Button>
          {p.state.history.length > 0 && (
            <Button size="sm" variant="outline" onClick={p.clearHistory}>
              <Trash2 className="h-4 w-4 mr-1" /> Limpar tudo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {p.state.history.length === 0 && (
          <div className="text-sm text-muted-foreground">Sem entradas ainda.</div>
        )}
        <ol className="relative border-l pl-4 space-y-3">
          {p.state.history.map((e) => (
            <li key={e.id} className="pl-2 flex items-start gap-2 group">
              <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-brand" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">
                  <ClientDate iso={e.date} />
                </div>
                <div className="text-sm">{e.text}</div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-40 group-hover:opacity-100"
                onClick={() => p.removeHistoryEntry(e.id)}
                title="Excluir entrada"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function ClientDate({ iso }: { iso: string }) {
  const [full, setFull] = useState<string | null>(null);
  useEffect(() => {
    try {
      setFull(new Date(iso).toLocaleString("pt-BR"));
    } catch {}
  }, [iso]);
  return <span suppressHydrationWarning>{full ?? formatDateBR(iso.slice(0, 10))}</span>;
}

// ---------- Schedule ----------
function ScheduleTab({ p }: { p: ReturnType<typeof useProject> }) {
  const [statusFilters, setStatusFilters] = useState<Set<ScheduleStatus>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const childrenOf = (wbs: string) =>
    p.state.schedule.filter((c) => !c.isGroup && c.wbs.startsWith(wbs + "."));

  const groupRange = (wbs: string) => {
    const kids = childrenOf(wbs);
    const starts = kids.map((k) => k.start).filter(Boolean) as string[];
    const finishes = kids.map((k) => k.finish).filter(Boolean) as string[];
    return {
      start: starts.length ? starts.sort()[0] : undefined,
      finish: finishes.length ? finishes.sort()[finishes.length - 1] : undefined,
    };
  };

  const list = p.state.schedule.filter((it) => {
    if (!it.isGroup) {
      const parent = it.wbs.split(".")[0];
      if (collapsed.has(parent)) return false;
    }
    if (statusFilters.size === 0) return true;
    if (it.isGroup) {
      // show groups whose children match
      return p.state.schedule.some(
        (c) => !c.isGroup && c.wbs.startsWith(it.wbs + ".") && statusFilters.has(c.status),
      );
    }
    return statusFilters.has(it.status);
  });

  const toggle = (wbs: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(wbs)) next.delete(wbs);
      else next.add(wbs);
      return next;
    });

  const exportOpts = { statuses: Array.from(statusFilters) };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <div>
          <CardTitle className="text-base">Cronograma inicial do projeto</CardTitle>
          <div className="text-xs text-muted-foreground mt-1">
            Baseado no cronograma anexado. Classifique cada tarefa conforme o andamento.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <MultiSelectPopover
            label="Status"
            values={SCHEDULE_STATUS_ORDER}
            options={SCHEDULE_STATUS_LABEL}
            selected={statusFilters}
            onChange={setStatusFilters}
            width={220}
          />
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
          <Button size="sm" onClick={() => exportSchedulePdf(p.state, exportOpts)}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadScheduleHtml(p.state, exportOpts)}>
            <Download className="h-4 w-4 mr-1" /> HTML
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b bg-muted/40">
              <th className="p-2 w-16">WBS</th>
              <th className="p-2">Tarefa</th>
              <th className="p-2 w-24">Duração</th>
              <th className="p-2 w-28">Início</th>
              <th className="p-2 w-28">Fim</th>
              <th className="p-2 w-44">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((it) => {
              const range = it.isGroup ? groupRange(it.wbs) : null;
              const start = it.isGroup ? (it.start ?? range?.start) : it.start;
              const finish = it.isGroup ? (it.finish ?? range?.finish) : it.finish;
              const isCollapsed = it.isGroup && collapsed.has(it.wbs);
              return (
              <tr
                key={it.id}
                className={
                  "border-b " + (it.isGroup ? "bg-brand/5 font-semibold" : "hover:bg-muted/30")
                }
              >
                <td className="p-2 align-top text-xs text-muted-foreground">{it.wbs}</td>
                <td className={"p-2 align-top " + (it.isGroup ? "text-brand" : "")}>
                  <span
                    className={it.isGroup ? "inline-flex items-center gap-1 cursor-pointer select-none" : ""}
                    style={{ paddingLeft: `${(it.wbs.split(".").length - 1) * 12}px` }}
                    onClick={it.isGroup ? () => toggle(it.wbs) : undefined}
                  >
                    {it.isGroup ? (
                      isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : null}
                    {it.name}
                  </span>
                </td>
                <td className="p-2 align-top text-xs">{it.duration ?? "—"}</td>
                <td className="p-2 align-top text-xs">{formatDateBR(start) || "—"}</td>
                <td className="p-2 align-top text-xs">{formatDateBR(finish) || "—"}</td>
                <td className="p-2 align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: scheduleStatusColor[it.status] }}
                      />
                      <Select
                        value={it.status}
                        onValueChange={(v) =>
                          p.updateScheduleItem(it.id, { status: v as ScheduleStatus })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEDULE_STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s}>
                              {SCHEDULE_STATUS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                </td>
              </tr>
              );
            })}

          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ---------- Overview edit ----------
function EditOverviewDialog({
  project,
  onSave,
}: {
  project: { projectName: string; manager: string; overview: string };
  onSave: (p: { projectName: string; manager: string; overview: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.projectName);
  const [manager, setManager] = useState(project.manager);
  const [overview, setOverview] = useState(project.overview);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Pencil className="h-4 w-4 mr-1" /> Editar projeto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar informações do projeto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Gerente</Label>
            <Input value={manager} onChange={(e) => setManager(e.target.value)} />
          </div>
          <div>
            <Label>Visão geral</Label>
            <Textarea rows={5} value={overview} onChange={(e) => setOverview(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onSave({ projectName: name, manager, overview });
              setOpen(false);
              toast.success("Projeto atualizado");
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Timeline ----------
function TimelineTab({ p }: { p: ReturnType<typeof useProject> }) {
  const [statuses, setStatuses] = useState<Set<TaskStatus>>(new Set());
  const [responsibles, setResponsibles] = useState<Set<string>>(new Set());
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [editingId, setEditingId] = useState<string | null>(null);
  const opts = { statuses: Array.from(statuses), responsibles: Array.from(responsibles) };

  const html = useMemo(() => buildTimelineHtml(p.state, opts), [p.state, statuses, responsibles]);
  const editingTask = editingId ? p.state.tasks.find((t) => t.id === editingId) : undefined;

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
      toast.success("Exportado");
    } catch (e) {
      toast.error("Falha ao exportar");
      console.error(e);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest("[data-task-id]") as HTMLElement | null;
    if (!el) return;
    const id = el.getAttribute("data-task-id");
    if (id) setEditingId(id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <div>
          <CardTitle className="text-base">Linha do tempo das tarefas</CardTitle>
          <div className="text-xs text-muted-foreground mt-1">
            Clique em uma tarefa para editá-la. As alterações sincronizam com a aba Tarefas.
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <MultiSelectPopover
            label="Status"
            values={STATUS_ORDER}
            options={STATUS_LABEL}
            selected={statuses}
            onChange={setStatuses}
            width={220}
          />
          <MultiSelectPopover
            label="Responsável"
            values={p.state.responsibles}
            options={(v) => v}
            selected={responsibles}
            onChange={setResponsibles}
            width={220}
          />
          <Select value={orientation} onValueChange={(v) => setOrientation(v as "portrait" | "landscape")}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Vertical (retrato)</SelectItem>
              <SelectItem value="landscape">Horizontal (paisagem)</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => run(() => exportTimelinePdf(p.state, opts, orientation))}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run(() => exportTimelinePng(p.state, opts, orientation))}
          >
            <Download className="h-4 w-4 mr-1" /> PNG
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadTimelineHtml(p.state, opts);
              toast.success("HTML exportado");
            }}
          >
            <Download className="h-4 w-4 mr-1" /> HTML
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          onClick={handleClick}
          style={{ background: "#ffffff", padding: "16px", borderRadius: "6px" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {editingTask && (
          <TaskDialog
            key={editingTask.id}
            existing={editingTask}
            responsibles={p.state.responsibles}
            onAddResponsible={p.addResponsible}
            hideTrigger
            open={true}
            onOpenChange={(v) => {
              if (!v) setEditingId(null);
            }}
            onSave={(patch) => {
              p.updateTask(editingTask.id, patch);
              p.addHistory(`Tarefa editada: "${patch.title ?? editingTask.title}"`);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}



