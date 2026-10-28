// Nuvem compartilhada do painel: um único registro criptografado, com mesclagem de edições simultâneas.
import { decryptJson, encryptJson, isEncryptedPayload, type EncryptedPayload } from "./crypto";
import type { ProjectState } from "./project-store";

declare const __CLOUD_URL__: string;
declare const __CLOUD_KEY__: string;

const TABLE = "/rest/v1/saved_analyses";
const ROW_ID = "materiais-state";

async function cloudFetch(path: string, init: RequestInit = {}, timeoutMs = 120000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${__CLOUD_URL__}${path}`, {
      ...init,
      cache: "no-store",
      signal: ctrl.signal,
      headers: { apikey: __CLOUD_KEY__, ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) },
    });
  } catch {
    throw new Error("Não foi possível acessar a nuvem (verifique a internet ou o bloqueio da rede).");
  } finally {
    clearTimeout(timer);
  }
}

async function cloudOk(r: Response, what: string): Promise<Response> {
  if (r.ok) return r;
  let detail = "";
  try { detail = (await r.json())?.message ?? ""; } catch { /* ignore */ }
  throw new Error(`${what}: a nuvem respondeu ${r.status}. ${detail}`.trim());
}

export type RemoteState =
  | { kind: "none" }
  | { kind: "unreadable"; rowAt: string }
  | { kind: "ok"; rowAt: string; state: ProjectState };

/** Só a data da última gravação (barato): usado para saber se alguém mudou algo. */
export async function fetchRemoteAt(): Promise<string | null> {
  const r = await cloudOk(await cloudFetch(`${TABLE}?select=updated_at&id=eq.${ROW_ID}`, {}, 30000), "Consultar a nuvem");
  const rows = (await r.json()) as { updated_at: string }[];
  return rows[0]?.updated_at ?? null;
}

export async function fetchRemote(): Promise<RemoteState> {
  const r = await cloudOk(await cloudFetch(`${TABLE}?select=updated_at,general_params&id=eq.${ROW_ID}`), "Baixar da nuvem");
  const row = ((await r.json()) as { updated_at: string; general_params: unknown }[])[0];
  if (!row) return { kind: "none" };
  if (!isEncryptedPayload(row.general_params)) return { kind: "unreadable", rowAt: row.updated_at };
  try {
    const p = await decryptJson<{ state: ProjectState }>(row.general_params as EncryptedPayload, ROW_ID);
    return p?.state ? { kind: "ok", rowAt: row.updated_at, state: p.state } : { kind: "unreadable", rowAt: row.updated_at };
  } catch {
    return { kind: "unreadable", rowAt: row.updated_at };
  }
}

/**
 * Grava só se ninguém gravou desde `expectedAt` (null = ainda não existe).
 * Retorna a nova data, ou null se houve conflito (alguém gravou antes).
 */
export async function pushRemote(state: ProjectState, expectedAt: string | null): Promise<string | null> {
  const newAt = new Date().toISOString();
  const payload = await encryptJson({ state }, ROW_ID);
  const row = {
    id: ROW_ID, name: "Materiais protegido", created_at: newAt, updated_at: newAt,
    general_params: payload, special_params: {}, kind: "materiais",
    file_name: null, file_base64: null, file_mime: null, edited_capla_site: null, edited_capla_st: null,
    folder: null, tracking_data: null,
  };
  if (expectedAt === null) {
    const r = await cloudOk(await cloudFetch(`${TABLE}?on_conflict=id&select=id`, {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify([row]),
    }), "Salvar na nuvem");
    return ((await r.json()) as unknown[]).length ? newAt : null;
  }
  const { id: _id, created_at: _c, ...patch } = row;
  void _id; void _c;
  const r = await cloudOk(await cloudFetch(`${TABLE}?id=eq.${ROW_ID}&updated_at=eq.${encodeURIComponent(expectedAt)}&select=id`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  }), "Salvar na nuvem");
  return ((await r.json()) as unknown[]).length ? newAt : null;
}

/* ---------- mesclagem de 3 vias (base = último estado sincronizado) ---------- */

export const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function mergeList<T extends { id: string }>(base: T[] | null, local: T[], remote: T[]): T[] {
  const b = new Map((base ?? []).map((x) => [x.id, x]));
  const l = new Map(local.map((x) => [x.id, x]));
  const r = new Map(remote.map((x) => [x.id, x]));
  const decide = (id: string): T | undefined => {
    const bi = b.get(id), li = l.get(id), ri = r.get(id);
    if (li && ri) {
      if (!bi) return li;
      if (sameJson(li, bi)) return ri;
      return li;
    }
    if (li) return !bi || !sameJson(li, bi) ? li : undefined; // remoto apagou (e eu não mexi)
    if (ri) return !bi || !sameJson(ri, bi) ? ri : undefined; // eu apaguei (e ninguém mexeu)
    return undefined;
  };
  const localKeepsOrder = !!base && sameJson(base.map((x) => x.id), local.map((x) => x.id));
  const order = localKeepsOrder
    ? [...remote.map((x) => x.id), ...local.map((x) => x.id)]
    : [...local.map((x) => x.id), ...remote.map((x) => x.id)];
  const out: T[] = [];
  const seen = new Set<string>();
  for (const id of order) {
    if (seen.has(id)) continue;
    seen.add(id);
    const v = decide(id);
    if (v) out.push(v);
  }
  return out;
}

function pick<T>(base: T | undefined, local: T, remote: T): T {
  if (sameJson(local, remote)) return local;
  if (base === undefined) return local;
  return sameJson(local, base) ? remote : local;
}

export function mergeStates(base: ProjectState | null, local: ProjectState, remote: ProjectState): ProjectState {
  const asItems = (xs: string[]) => xs.map((id) => ({ id }));
  return {
    projectName: pick(base?.projectName, local.projectName, remote.projectName),
    manager: pick(base?.manager, local.manager, remote.manager),
    overview: pick(base?.overview, local.overview, remote.overview),
    tasks: mergeList(base?.tasks ?? null, local.tasks, remote.tasks),
    risks: mergeList(base?.risks ?? null, local.risks, remote.risks),
    meetings: mergeList(base?.meetings ?? null, local.meetings, remote.meetings),
    history: mergeList(base?.history ?? null, local.history, remote.history),
    schedule: mergeList(base?.schedule ?? null, local.schedule, remote.schedule),
    responsibles: mergeList(
      base ? asItems(base.responsibles) : null, asItems(local.responsibles), asItems(remote.responsibles),
    ).map((x) => x.id).sort(),
  };
}
