// Sincronização com o servidor local (servidor.py): grava os dados em disco a cada alteração.
export const isServerMode = () =>
  typeof location !== "undefined" && location.protocol === "http:" && location.port === "8765";

const API = "/api/materiais";
const HEADERS = { "Content-Type": "application/json", "X-Requested-With": "local-app" };

/** Texto salvo no servidor, ou null se ainda não existir. */
export async function serverPullText(): Promise<string | null> {
  const r = await fetch(API, { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Servidor local respondeu ${r.status}`);
  return r.text();
}

export async function serverPushText(text: string): Promise<void> {
  const r = await fetch(API, { method: "PUT", headers: HEADERS, body: text });
  if (!r.ok) throw new Error(`Servidor local respondeu ${r.status}`);
}
