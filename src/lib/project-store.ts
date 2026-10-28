import { useEffect, useState, useCallback, useRef } from "react";
import { EMBEDDED_DATA } from "./embedded-data";
import { isServerMode, serverPullText, serverPushText } from "./server-sync";
import { fetchRemote, fetchRemoteAt, mergeStates, pushRemote, sameJson } from "./cloud-sync";
import {
  isAutoBackupSupported,
  loadBackupHandle,
  saveBackupHandle,
  clearBackupHandle,
  pickBackupFile,
  hasWritePermission,
  requestWritePermission,
  readBackupFileText,
  writeBackupFile,
} from "./auto-backup";



export type TaskStatus = "finalizado" | "em_andamento" | "a_iniciar" | "caminho_critico";
export type ScheduleStatus = "nao_iniciada" | "em_andamento" | "finalizada" | "atrasada";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export interface Task {
  id: string;
  title: string;
  responsible: string;
  status: TaskStatus;
  deadline?: string;
  notes?: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface RiskComment {
  id: string;
  text: string;
  date: string;
}

export interface Risk {
  id: string;
  description: string;
  createdAt: string;
  resolved?: boolean;
  comments?: RiskComment[];
}

export interface Meeting {
  id: string;
  date: string;
  title: string;
  attendees: string;
  summary: string;
  decisions: string;
  followUp: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  text: string;
}

export interface ScheduleItem {
  id: string;
  wbs: string;
  name: string;
  duration?: string;
  start?: string;
  finish?: string;
  status: ScheduleStatus;
  isGroup?: boolean;
}

export interface ProjectState {
  projectName: string;
  manager: string;
  overview: string;
  tasks: Task[];
  risks: Risk[];
  meetings: Meeting[];
  history: HistoryEntry[];
  responsibles: string[];
  schedule: ScheduleItem[];
}

const STORAGE_KEY = "materiais-capitalizaveis-v1";
const CLOUD_BASE_KEY = "cloud-base";
const CLOUD_AT_KEY = "materiais-cloud-at";
const FRESH_KEY = "materiais-fresh-install";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  finalizado: "Finalizado",
  em_andamento: "Em andamento",
  a_iniciar: "A iniciar",
  caminho_critico: "Caminho crítico",
};

export const STATUS_ORDER: TaskStatus[] = ["caminho_critico", "em_andamento", "a_iniciar", "finalizado"];

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  nao_iniciada: "Não iniciada",
  em_andamento: "Em andamento",
  finalizada: "Finalizada",
  atrasada: "Atrasada",
};

export const SCHEDULE_STATUS_ORDER: ScheduleStatus[] = [
  "nao_iniciada",
  "em_andamento",
  "finalizada",
  "atrasada",
];

export const splitResponsibles = (raw: string): string[] =>
  raw
    .split(/[/,;]/)
    .map((r) => r.trim())
    .filter(Boolean);

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const parseDMY = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (!m) return undefined;
  const [, d, mo, y] = m;
  const yyyy = y.length === 2 ? `20${y}` : y;
  return `${yyyy}-${mo}-${d}`;
};

const seedSchedule = (): ScheduleItem[] => {
  const items: Array<Omit<ScheduleItem, "id" | "status"> & { status?: ScheduleStatus }> = [
    { wbs: "1", name: "Iniciação", duration: "23 days", isGroup: true },
    { wbs: "1.1", name: "Criar TAP", duration: "8 days", start: parseDMY("16/10/25"), finish: parseDMY("23/10/25") },
    { wbs: "1.2", name: "Definir quais stakeholders e departamentos serão envolvidos", duration: "8 days", start: parseDMY("16/10/25"), finish: parseDMY("23/10/25") },
    { wbs: "1.3", name: "Criação de cronograma preliminar", duration: "15 days", start: parseDMY("24/10/25"), finish: parseDMY("07/11/25") },
    { wbs: "2", name: "Planejamento", duration: "50 days", isGroup: true },
    { wbs: "2.1", name: "Desenhar mapeamento do processo fiscal atual (“as-is”)", duration: "8 days", start: parseDMY("31/10/25"), finish: parseDMY("07/11/25") },
    { wbs: "2.2", name: "Desenhar mapeamento do novo processo fiscal requerido (“to-be”)", duration: "8 days", start: parseDMY("31/10/25"), finish: parseDMY("07/11/25") },
    { wbs: "2.3", name: "Desenhar mapeamento do novo processo logístico requerido (“to-be”)", duration: "12 days", start: parseDMY("10/11/25"), finish: parseDMY("21/11/25") },
    { wbs: "2.4", name: "Definir quais materiais serão cobertos pelo projeto", duration: "10 days", start: parseDMY("24/11/25"), finish: parseDMY("03/12/25") },
    { wbs: "2.5", name: "Definir modelo de emissão de Nota Fiscal para novas compras e itens reparados", duration: "8 days", start: parseDMY("31/10/25"), finish: parseDMY("07/11/25") },
    { wbs: "2.6", name: "Alinhar modelo de emissão de Nota Fiscal de reparo com o cliente", duration: "5 days", start: parseDMY("08/12/25"), finish: parseDMY("12/12/25") },
    { wbs: "2.7", name: "Alinhar quais atividades farão parte do projeto", duration: "8 days", start: parseDMY("31/10/25"), finish: parseDMY("07/11/25") },
    { wbs: "2.8", name: "Escolher as plantas que farão parte do projeto", duration: "8 days", start: parseDMY("31/10/25"), finish: parseDMY("07/11/25") },
    { wbs: "2.9", name: "Definir quantidade de recursos adicionais para controlar a operação após projeto", duration: "16 days", start: parseDMY("04/12/25"), finish: parseDMY("19/12/25") },
    { wbs: "3", name: "Execução", duration: "323 days", isGroup: true },
    { wbs: "3.1", name: "Parametrizar os sistemas, principalmente SAP", duration: "92 days", start: parseDMY("12/01/26"), finish: parseDMY("13/04/26") },
    { wbs: "3.2", name: "Criar Plantas/Storage Location para os parques envolvidos nos Estados corretos", duration: "92 days", start: parseDMY("12/01/26"), finish: parseDMY("13/04/26") },
    { wbs: "3.3", name: "Ajustar parâmetro de Special Procurement key", duration: "11 days", start: parseDMY("14/04/26"), finish: parseDMY("24/04/26") },
    { wbs: "3.4", name: "Configurar Master Data da nova Planta", duration: "11 days", start: parseDMY("14/04/26"), finish: parseDMY("24/04/26") },
    { wbs: "3.5", name: "Configurar sistemas fiscais para entrega de obrigações acessórias", duration: "19 days", start: parseDMY("27/04/26"), finish: parseDMY("15/05/26") },
    { wbs: "3.6", name: "Realizar testes e simulações sistêmicas", duration: "22 days", start: parseDMY("18/05/26"), finish: parseDMY("08/06/26") },
    { wbs: "3.7", name: "Criar separação física no Warehouse", duration: "22 days", start: parseDMY("09/06/26"), finish: parseDMY("30/06/26") },
    { wbs: "3.8", name: "Treinar stakeholders e departamentos envolvidos", duration: "22 days", start: parseDMY("09/06/26"), finish: parseDMY("30/06/26") },
    { wbs: "3.9", name: "Comunicar o novo procedimento aos departamentos e ao cliente", duration: "1 day", start: parseDMY("01/07/26"), finish: parseDMY("01/07/26") },
    { wbs: "3.10", name: "Iniciar operação de compra", duration: "1 day", start: parseDMY("02/07/26"), finish: parseDMY("02/07/26") },
    { wbs: "3.11", name: "Solicitar a primeira compra com o novo procedimento", duration: "124 days", start: parseDMY("03/07/26"), finish: parseDMY("03/11/26") },
    { wbs: "3.12", name: "Emitir primeira nota fiscal ao cliente", duration: "27 days", start: parseDMY("04/11/26"), finish: parseDMY("30/11/26") },
    { wbs: "4", name: "Monitoramento e Controle", duration: "323 days", isGroup: true },
    { wbs: "4.1", name: "Monitorar performance dos recursos de controle contratados", duration: "323 days", start: parseDMY("12/01/26"), finish: parseDMY("30/11/26") },
    { wbs: "4.2", name: "Monitorar os benefícios fiscais do novo procedimento", duration: "323 days", start: parseDMY("12/01/26"), finish: parseDMY("30/11/26") },
    { wbs: "4.3", name: "Fazer reunião de follow up", duration: "323 days", start: parseDMY("12/01/26"), finish: parseDMY("30/11/26") },
    { wbs: "4.4", name: "Identificar desvios de Notas Fiscais", duration: "323 days", start: parseDMY("12/01/26"), finish: parseDMY("30/11/26") },
    { wbs: "4.5", name: "Monitorar desempenho dos sistemas após parametrização", duration: "323 days", start: parseDMY("12/01/26"), finish: parseDMY("30/11/26") },
    { wbs: "5", name: "Encerramento", duration: "31 days", isGroup: true },
    { wbs: "5.1", name: "Avaliar desempenho dos sistemas", duration: "31 days", start: parseDMY("01/12/26"), finish: parseDMY("31/12/26") },
    { wbs: "5.2", name: "Identificar lições aprendidas e pontos de melhorias", duration: "31 days", start: parseDMY("01/12/26"), finish: parseDMY("31/12/26") },
    { wbs: "5.3", name: "Encerrar projeto", duration: "31 days", start: parseDMY("01/12/26"), finish: parseDMY("31/12/26") },
  ];
  return items.map((it) => ({ ...it, id: uid(), status: it.status ?? "nao_iniciada" }));
};

const seed = (): ProjectState => {
  const mk = (title: string, responsible: string, status: TaskStatus, deadline?: string): Task => ({
    id: uid(),
    title,
    responsible,
    status,
    deadline,
    createdAt: now(),
    attachments: [],
  });
  const tasks: Task[] = [
    mk("Realizar testes voltados à parte de Supply (ativação de demandas → retorno ao estoque, Main Components)", "Lucas", "finalizado"),
    mk("Marcar reunião para efetuar os testes com Laís, Leonardo e Lucas", "Arthur", "finalizado"),
    mk("Criação do novo tipo de movimento (Z89 e Z90) para checagem da etapa final do teste de emissão de NF", "Tathiane", "finalizado"),
    mk("Solicitar a criação da nova planta do WH de Simões Filho (5697)", "Vanusa Cardoso / Tathiane / Leonardo", "finalizado"),
    mk("Criação das plantas de Industrialização (56F9, 56G9, 56H0, 56H2, 56H3)", "Leonardo", "finalizado"),
    mk("Verificar custo e tributação presente na NF (ambiente de testes SAP) referente ao novo movimento", "Vanusa / Vanessa Da Silva Garcia", "finalizado"),
    mk("Envolver equipe de desenvolvimento do SF para checar comportamento do sistema", "Brenno Alves de Castro", "finalizado"),
    mk("Subir movimento para a PE1", "Tathiane", "finalizado"),
    mk("Enriquecimento dos materiais na 5697 (consumíveis via global; corretivas priorizar locais)", "Leonardo / Bruna", "em_andamento"),
    mk("Verificar a emissão de NF nas plantas novas", "Vanusa", "em_andamento"),
    mk("Definir parametrização de abastecimento da 5697 e alterar plantas antigas (espelhar 5694)", "Leonardo / Lucas", "a_iniciar"),
    mk("Separação de novo Main warehouse/storage location de industrialização 5697 (físico) — envolver Ayrton do WH", "Lucas", "a_iniciar"),
    mk("Separação das novas plantas de industrialização no parque (físico)", "Nialfe", "a_iniciar"),
    mk("Nova análise de Compliance após migração final ao ambiente de produção", "Vanessa Da Silva Garcia", "a_iniciar"),
    mk("Criar POs para compra dos materiais de Service já no formato de industrialização (pendente parametrização 5697)", "Lucas", "a_iniciar"),
    mk("Criar MRP para inserir os pedidos no 5697 1000", "Lucas / Laís / Karol", "a_iniciar"),
    mk("Configurar MRP para inserir os pedidos no 5697 1000", "Leonardo", "a_iniciar"),
    mk("Time de compras parametrizar as condições de compras na 5697 (copiar configuração da 5694)", "Taís Reis / Bruna Brenno", "a_iniciar"),
    mk("Realizar o teste no SF em ambiente de testes com novo movimento Z89/Z90", "Equipe SF", "a_iniciar"),
    mk("Lista e data por item de todos os materiais para enriquecimento/ajustes/configuração (≥15 dias p/ cadastro)", "Lucas / Laís", "a_iniciar"),
    mk("Desenvolver SAP/Salesforce para a reserva de materiais de YM01", "Brenno Alves de Castro", "caminho_critico", "2026-07-10"),
    mk("Subir movimento para a PE1", "Tathiane", "caminho_critico", "2026-06-21"),
    mk("Criar MRP e configurá-lo para inserir pedidos no 5697 1000 (Plano B: PO manual)", "Lucas", "caminho_critico"),
    mk("Criar SL 1020 e MRP para todas as plantas (56E0, 56E1, 56E2, 56D8, 56D9)", "Laís", "em_andamento"),
  ];
  const responsibles = Array.from(
    new Set(tasks.flatMap((t) => splitResponsibles(t.responsible))),
  ).sort();
  return {
    projectName: "Materiais Capitalizáveis",
    manager: "Gerente de Projeto",
    overview:
      "O projeto visa corrigir a deficiência no processo atual de emissão de notas fiscais para materiais utilizados na manutenção das turbinas, focando principalmente nos contratos “full scope”. \n\nAtualmente, apenas NFs de serviços são emitidas, sem contemplar notas de saída dos materiais consumidos nas turbinas eólicas, gerando riscos fiscais e contábeis. \n\nO cliente Auren foi o pioneiro a levantar essa demanda, porém, por se tratar da regularização do processo fiscal de emissão de notas a ideia é, futuramente, que à iniciativa desse projeto seja expandida para todos os parques do Brasil. \n\nO projeto envolve criação de novas plantas de industrialização, ajustes de SAP/Salesforce e alinhamento com fornecedores.",
    tasks,
    responsibles,
    schedule: seedSchedule(),
    risks: [
      { id: uid(), description: "Criar travas sistêmicas para evitar consumos de materiais em plantas erradas", createdAt: now(), resolved: false, comments: [] },
      { id: uid(), description: "Surplus — Planejamento deverá ter total atenção para evitar que ocorra", createdAt: now(), resolved: false, comments: [] },
      { id: uid(), description: "Risco da reforma tributária — mudar conceito; avaliar cost out efetivo posteriormente", createdAt: now(), resolved: false, comments: [] },
      { id: uid(), description: "Ativação da demanda de materiais de industrialização para planta de consumo e vice-versa", createdAt: now(), resolved: false, comments: [] },
      { id: uid(), description: "Sincronização de parâmetros e configuração entre SAP > Salesforce", createdAt: now(), resolved: false, comments: [] },
      { id: uid(), description: "Necessidade de mão de obra adicional para operacionalizar o novo processo", createdAt: now(), resolved: false, comments: [] },
      { id: uid(), description: "Possibilidade de atrelar o mesmo serial em duas plantas distintas (Uso e Consumo e Industrialização)", createdAt: now(), resolved: false, comments: [] },
      { id: uid(), description: "Ordens precisam ter custo e consumo atrelados — verificar se novo movimento mantém sistemática atual", createdAt: now(), resolved: false, comments: [] },
      { id: uid(), description: "Limitação sistêmica ao criar novas plantas de industrialização atreladas ao mesmo SC das plantas de uso e consumo", createdAt: now(), resolved: false, comments: [] },
    ],
    meetings: [
      {
        id: uid(),
        date: new Date().toISOString().slice(0, 10),
        title: "Recorrência — Andamento da parametrização do sistema",
        attendees: "Vanessa Garcia, Nialfe, Tati, Cliente, Operações, Planejamento, Supply Chain",
        summary:
          "Bloqueio sistêmico: uma turbina não pode estar atrelada a duas plantas distintas (Uso e Consumo e Industrialização).\n\nSugestão aprovada por Nialfe: aumentar o escopo do projeto para todos os tipos de ordens; consumir sistemicamente todos os materiais previstos até o fim do ano; atualizar a usagem das plantas para Industrialização; em caso de P70/P80 alterar a usagem (grupo de follow up).\n\nImpactos: custo de inventário; alterar usagem em caso de P70/P80 (manual); processo de DEF de itens serializados; alinhar com o cliente que não receberão NF desses itens fora de estoque; itens fora de estoque ficarão imobilizados.",
        decisions:
          "Aumentar escopo do projeto (aprovado por Nialfe).\nCriar SL 1020 e MRP para as plantas 56E0, 56E1, 56E2, 56D8, 56D9 (@Laís).\nWorkaround: tratar via PO com fornecedor para 2026 (2027 migra para net price devido à reforma tributária).\nVerificar parametrização com fornecedores para faturamento Industrialização na 5697 (mesmo CNPJ da 5694).",
        followUp:
          "Alinhar com o buyer alteração de cabeçalho (@Lucas).\nEnvolver equipe SF para checar comportamento do sistema com novo escopo (@Brenno).\nEnriquecer materiais na 5697 — consumíveis via global; corretivas priorizar locais (@Leonardo / @Bruna).\nDefinir parametrização de abastecimento da 5697 espelhando 5694 (@Leonardo / @Lucas).",
        createdAt: now(),
      },
    ],
    history: [
      { id: uid(), date: now(), text: "Projeto inicializado com base na ata da reunião de recorrência." },
    ],
  };
};

export function formatDateBR(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

const DB_NAME = "materiais-capitalizaveis-db";
const DB_STORE = "kv";
const DB_KEY = "project-state";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string = DB_KEY): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(value: unknown, key: string = DB_KEY): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const mergeParsed = (base: ProjectState, parsed: Partial<ProjectState>): ProjectState => ({
  ...base,
  ...parsed,
  responsibles:
    parsed.responsibles && parsed.responsibles.length ? parsed.responsibles : base.responsibles,
  schedule: parsed.schedule && parsed.schedule.length ? parsed.schedule : base.schedule,
  risks: (parsed.risks ?? base.risks).map((r) => ({ resolved: false, comments: [], ...r })),
  tasks: (parsed.tasks ?? base.tasks).map((t) => ({ attachments: [], ...t })),
});

export function parseBackup(text: string): Partial<ProjectState> {
  const obj = JSON.parse(text);
  const data = obj && typeof obj === "object" && "data" in obj && "app" in obj ? obj.data : obj;
  if (!data || typeof data !== "object" || !Array.isArray((data as ProjectState).tasks)) {
    throw new Error("Arquivo de backup inválido.");
  }
  return data as Partial<ProjectState>;
}

export type BackupStatus = "unsupported" | "none" | "needs-permission" | "active";
export type ServerSync = { enabled: boolean; status: "idle" | "ok" | "error"; lastAt?: string };
const LOCAL_AT_KEY = "materiais-local-saved-at";

const buildBackupPayload = (state: ProjectState) => ({
  app: "materiais-capitalizaveis",
  version: 1,
  exportedAt: now(),
  data: state,
});

export function downloadBackup(state: ProjectState) {
  const payload = buildBackupPayload(state);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `materiais-capitalizaveis-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type CloudInfo = { status: "idle" | "syncing" | "ok" | "error"; lastAt?: string; error?: string };

export function useProject() {
  // Always seed on first render; load persisted state after mount.
  const [state, setState] = useState<ProjectState>(seed);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [backup, setBackup] = useState<{ status: BackupStatus; fileName?: string; lastAt?: string }>({
    status: isAutoBackupSupported() ? "none" : "unsupported",
  });
  const handleRef = useRef<any>(null);
  const baselineRef = useRef<ProjectState | null>(null);
  const [server, setServer] = useState<ServerSync>({ enabled: isServerMode(), status: "idle" });
  const serverReadyRef = useRef(false);

  const pushServer = useCallback(async (value: ProjectState) => {
    if (!serverReadyRef.current) return;
    try {
      await serverPushText(JSON.stringify(buildBackupPayload(value), null, 2));
      setServer({ enabled: true, status: "ok", lastAt: now() });
    } catch (e) {
      console.error("[project-store] server save failed", e);
      setServer((s) => ({ ...s, enabled: true, status: "error" }));
    }
  }, []);

  const writeBackup = useCallback(async (value: ProjectState) => {
    const h = handleRef.current;
    if (!h) return;
    try {
      await writeBackupFile(h, JSON.stringify(buildBackupPayload(value), null, 2));
      setBackup((b) => ({ ...b, status: "active", lastAt: now() }));
    } catch (e) {
      console.error("[project-store] auto backup failed", e);
      setBackup((b) => ({ ...b, status: "needs-permission" }));
    }
  }, []);

  useEffect(() => {
    if (!isAutoBackupSupported()) return;
    (async () => {
      const h = await loadBackupHandle();
      if (!h) return;
      handleRef.current = h;
      const ok = await hasWritePermission(h);
      setBackup({ status: ok ? "active" : "needs-permission", fileName: h.name });
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Servidor local: o arquivo em disco é a fonte principal; só grava de volta depois de ler com sucesso.
        let remote: { data: Partial<ProjectState>; at?: string } | null = null;
        if (isServerMode()) {
          try {
            const text = await serverPullText();
            if (text !== null) remote = { data: parseBackup(text), at: JSON.parse(text).exportedAt };
            serverReadyRef.current = true;
          } catch (e) {
            console.error("[project-store] server load failed", e);
            setServer({ enabled: true, status: "error" });
          }
        }
        const stored = await idbGet<Partial<ProjectState>>();
        let parsed: Partial<ProjectState> | null = stored ?? null;
        if (!parsed) {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) parsed = JSON.parse(raw) as Partial<ProjectState>;
          } catch {}
        }
        if (remote) {
          // Se o navegador tem alterações mais novas que o disco (servidor ficou fora do ar), mantém as do navegador.
          const localAt = localStorage.getItem(LOCAL_AT_KEY);
          if (!(stored && localAt && remote.at && localAt > remote.at)) parsed = remote.data;
        } else if (!parsed) {
          parsed = EMBEDDED_DATA;
          // Navegador novo: na primeira sincronização vale o que já está na nuvem, não os dados iniciais.
          localStorage.setItem(FRESH_KEY, "1");
        }
        if (!cancelled && parsed) setState((base) => mergeParsed(base, parsed!));
      } catch (e) {
        console.error("[project-store] load failed", e);
      }
      if (!cancelled) setHydrated(true);
      try {
        await navigator.storage?.persist?.();
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (value: ProjectState) => {
    try {
      await idbSet(JSON.parse(JSON.stringify(value)));
      localStorage.setItem(LOCAL_AT_KEY, now());
      return true;
    } catch (e) {
      console.error("[project-store] save failed", e);
      return false;
    }
  }, []);

  // ---- nuvem compartilhada (criptografada; mescla edições de colegas) ----
  const [cloud, setCloud] = useState<CloudInfo>({ status: "idle" });
  const cloudBaseRef = useRef<ProjectState | null>(null);
  const cloudAtRef = useRef<string | null>(null);
  const cloudLoadedRef = useRef(false);
  const cloudBusyRef = useRef(false);
  const cloudAgainRef = useRef(false);
  const syncCloudRef = useRef<() => Promise<void>>(async () => {});

  const syncCloud = useCallback(async (): Promise<void> => {
    if (cloudBusyRef.current) {
      cloudAgainRef.current = true;
      return;
    }
    cloudBusyRef.current = true;
    setCloud((c) => ({ ...c, status: "syncing" }));
    try {
      if (!cloudLoadedRef.current) {
        cloudBaseRef.current = (await idbGet<ProjectState>(CLOUD_BASE_KEY)) ?? null;
        cloudAtRef.current = localStorage.getItem(CLOUD_AT_KEY);
        cloudLoadedRef.current = true;
      }
      let done = false;
      for (let attempt = 0; attempt < 4 && !done; attempt++) {
        const local = stateRef.current;
        const localChanged = !sameJson(local, cloudBaseRef.current);
        const remoteAt = await fetchRemoteAt();
        if (remoteAt !== null && remoteAt === cloudAtRef.current && !localChanged) {
          done = true;
          break;
        }
        const remote = await fetchRemote();
        const remoteState = remote.kind === "ok" ? mergeParsed(local, remote.state) : null;
        let target = local;
        if (remoteState) {
          if (localStorage.getItem(FRESH_KEY) === "1") target = remoteState;
          else if (remote.kind === "ok" && remote.rowAt !== cloudAtRef.current) {
            target = mergeStates(cloudBaseRef.current, local, remoteState);
          }
        }
        if (!sameJson(target, local)) {
          if (stateRef.current !== local) continue; // houve edição durante a sincronização: tenta de novo
          stateRef.current = target;
          setState(target);
        }
        let rowAt = remote.kind === "ok" ? remote.rowAt : null;
        if (!remoteState || !sameJson(target, remoteState)) {
          const expected = remote.kind === "none" ? null : remote.rowAt;
          const at = await pushRemote(target, expected);
          if (at === null) continue; // alguém gravou antes: baixa, mescla e tenta de novo
          rowAt = at;
        }
        cloudBaseRef.current = target;
        cloudAtRef.current = rowAt;
        await idbSet(target, CLOUD_BASE_KEY);
        if (rowAt) localStorage.setItem(CLOUD_AT_KEY, rowAt);
        localStorage.removeItem(FRESH_KEY);
        done = true;
      }
      if (!done) throw new Error("Muitas alterações simultâneas; tente sincronizar de novo.");
      setCloud({ status: "ok", lastAt: now() });
    } catch (e) {
      console.error("[project-store] cloud sync failed", e);
      setCloud((c) => ({ ...c, status: "error", error: e instanceof Error ? e.message : String(e) }));
    } finally {
      cloudBusyRef.current = false;
      if (cloudAgainRef.current) {
        cloudAgainRef.current = false;
        void syncCloudRef.current();
      }
    }
  }, []);
  syncCloudRef.current = syncCloud;

  useEffect(() => {
    if (!hydrated) return;
    void syncCloud();
    const timer = setInterval(() => void syncCloud(), 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncCloud();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated, syncCloud]);

  useEffect(() => {
    if (!hydrated) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    setSaveStatus("saving");
    saveDebounceRef.current = setTimeout(async () => {
      const ok = await persist(state);
      if (!ok) {
        setSaveStatus("idle");
        return;
      }
      // A primeira gravação após carregar só confirma o estado inicial; o arquivo de backup só muda com edições.
      if (baselineRef.current === null) baselineRef.current = state;
      else await writeBackup(state);
      await pushServer(state);
      void syncCloud();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    }, 600);
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [state, hydrated, persist, writeBackup, pushServer, syncCloud]);

  // Garante o salvamento ao fechar/trocar de aba antes do debounce disparar.
  useEffect(() => {
    if (!hydrated) return;
    const flush = () => {
      if (document.visibilityState === "hidden") void persist(stateRef.current);
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [hydrated, persist]);

  const replaceState = useCallback((incoming: Partial<ProjectState>) => {
    setState(mergeParsed(seed(), incoming));
  }, []);

  // Escolhe o arquivo de backup automático; se já houver um backup nele, oferece carregá-lo antes de sobrescrever.
  const setupBackup = useCallback(async () => {
    let h: any;
    try {
      h = await pickBackupFile();
    } catch {
      return; // cancelado
    }
    let next: ProjectState = stateRef.current;
    const text = await readBackupFileText(h).catch(() => "");
    if (text.trim()) {
      try {
        const parsed = parseBackup(text);
        const exported = JSON.parse(text).exportedAt as string | undefined;
        const info =
          `Esse arquivo já contém um backup (${(parsed.tasks ?? []).length} tarefas, ` +
          `${(parsed.history ?? []).length} registros de histórico` +
          (exported ? `, gravado em ${new Date(exported).toLocaleString("pt-BR")}` : "") +
          ").\n\n";
        if (confirm(info + "OK = CARREGAR os dados desse arquivo no painel (recomendado).\nCancelar = outra opção.")) {
          next = mergeParsed(seed(), parsed);
          setState(next);
        } else if (!confirm(info + "Sobrescrever o arquivo com os dados atuais do painel?")) {
          return;
        }
      } catch {
        if (!confirm("O arquivo escolhido não parece ser um backup deste painel. Sobrescrever com os dados atuais?")) return;
      }
    }
    await saveBackupHandle(h);
    handleRef.current = h;
    setBackup({ status: "active", fileName: h.name });
    await writeBackup(next);
  }, [writeBackup]);

  const reactivateBackup = useCallback(async () => {
    const h = handleRef.current;
    if (!h) return;
    if (await requestWritePermission(h)) {
      setBackup({ status: "active", fileName: h.name });
      await writeBackup(stateRef.current);
    }
  }, [writeBackup]);

  const disableBackup = useCallback(async () => {
    handleRef.current = null;
    await clearBackupHandle().catch(() => undefined);
    setBackup({ status: isAutoBackupSupported() ? "none" : "unsupported" });
  }, []);

  const addHistory = useCallback((text: string) => {
    setState((s) => ({ ...s, history: [{ id: uid(), date: now(), text }, ...s.history] }));
  }, []);

  const addTask = useCallback((t: Omit<Task, "id" | "createdAt">) => {
    setState((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: uid(), createdAt: now() }] }));
    addHistory(`Nova tarefa criada: "${t.title}" — ${t.responsible} [${STATUS_LABEL[t.status]}]`);
  }, [addHistory]);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== id) }));
    addHistory(`Tarefa removida (id ${id.slice(0, 6)})`);
  }, [addHistory]);

  const moveTask = useCallback((id: string, direction: -1 | 1) => {
    setState((s) => {
      const idx = s.tasks.findIndex((t) => t.id === id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= s.tasks.length) return s;
      const arr = [...s.tasks];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...s, tasks: arr };
    });
  }, []);

  const reorderTasks = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setState((s) => {
      const from = s.tasks.findIndex((t) => t.id === fromId);
      const to = s.tasks.findIndex((t) => t.id === toId);
      if (from < 0 || to < 0) return s;
      const arr = [...s.tasks];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...s, tasks: arr };
    });
  }, []);

  const addRisk = useCallback((description: string) => {
    setState((s) => ({
      ...s,
      risks: [
        ...s.risks,
        { id: uid(), description, createdAt: now(), resolved: false, comments: [] },
      ],
    }));
    addHistory(`Novo risco/oportunidade: ${description}`);
  }, [addHistory]);

  const removeRisk = useCallback((id: string) => {
    setState((s) => ({ ...s, risks: s.risks.filter((r) => r.id !== id) }));
  }, []);

  const toggleRiskResolved = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      risks: s.risks.map((r) => (r.id === id ? { ...r, resolved: !r.resolved } : r)),
    }));
  }, []);

  const addRiskComment = useCallback((riskId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setState((s) => ({
      ...s,
      risks: s.risks.map((r) =>
        r.id === riskId
          ? { ...r, comments: [...(r.comments ?? []), { id: uid(), text: t, date: now() }] }
          : r,
      ),
    }));
  }, []);

  const removeRiskComment = useCallback((riskId: string, commentId: string) => {
    setState((s) => ({
      ...s,
      risks: s.risks.map((r) =>
        r.id === riskId ? { ...r, comments: (r.comments ?? []).filter((c) => c.id !== commentId) } : r,
      ),
    }));
  }, []);

  const addMeeting = useCallback((m: Omit<Meeting, "id" | "createdAt">) => {
    setState((s) => ({ ...s, meetings: [{ ...m, id: uid(), createdAt: now() }, ...s.meetings] }));
    addHistory(`Ata registrada: "${m.title}" (${m.date})`);
  }, [addHistory]);

  const removeMeeting = useCallback((id: string) => {
    setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== id) }));
  }, []);

  const removeHistoryEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));
  }, []);

  const clearHistory = useCallback(() => {
    if (confirm("Limpar todo o histórico?")) {
      setState((s) => ({ ...s, history: [] }));
    }
  }, []);

  const updateOverview = useCallback(
    (patch: Partial<Pick<ProjectState, "projectName" | "manager" | "overview">>) => {
      setState((s) => ({ ...s, ...patch }));
    },
    [],
  );

  const addResponsible = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setState((s) => (s.responsibles.includes(clean) ? s : { ...s, responsibles: [...s.responsibles, clean].sort() }));
    addHistory(`Responsável cadastrado: ${clean}`);
  }, [addHistory]);

  const renameResponsible = useCallback((oldName: string, newName: string) => {
    const clean = newName.trim();
    if (!clean || clean === oldName) return;
    setState((s) => ({
      ...s,
      responsibles: Array.from(new Set(s.responsibles.map((r) => (r === oldName ? clean : r)))).sort(),
      tasks: s.tasks.map((t) => {
        const parts = splitResponsibles(t.responsible);
        if (!parts.includes(oldName)) return t;
        return { ...t, responsible: parts.map((p) => (p === oldName ? clean : p)).join(" / ") };
      }),
    }));
    addHistory(`Responsável renomeado: ${oldName} → ${clean}`);
  }, [addHistory]);

  const removeResponsible = useCallback((name: string) => {
    setState((s) => ({ ...s, responsibles: s.responsibles.filter((r) => r !== name) }));
    addHistory(`Responsável removido: ${name}`);
  }, [addHistory]);

  const updateScheduleItem = useCallback((id: string, patch: Partial<ScheduleItem>) => {
    setState((s) => ({
      ...s,
      schedule: s.schedule.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }, []);

  const resetAll = useCallback(() => {
    if (confirm("Restaurar dados iniciais? Todo o conteúdo será substituído.")) {
      setState(seed());
    }
  }, []);

  return {
    state,
    hydrated,
    saveStatus,
    addTask,
    updateTask,
    removeTask,
    moveTask,
    reorderTasks,
    addRisk,
    removeRisk,
    toggleRiskResolved,
    addRiskComment,
    removeRiskComment,
    addMeeting,
    removeMeeting,
    addHistory,
    removeHistoryEntry,
    clearHistory,
    updateOverview,
    addResponsible,
    renameResponsible,
    removeResponsible,
    updateScheduleItem,
    resetAll,
    replaceState,
    backup,
    server,
    cloud,
    syncCloudNow: syncCloud,
    setupBackup,
    reactivateBackup,
    disableBackup,
  };
}
