import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Meeting, ProjectState, Task, ScheduleItem, ScheduleStatus, TaskStatus } from "./project-store";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  SCHEDULE_STATUS_LABEL,
  SCHEDULE_STATUS_ORDER,
  splitResponsibles,
} from "./project-store";

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
};

const BRAND: [number, number, number] = [16, 115, 158];
const WARN: [number, number, number] = [214, 182, 86];

// ---------- Meeting PDF ----------
export interface MeetingExportOpts {
  statuses?: TaskStatus[]; // which task statuses to include
  responsibles?: string[]; // which responsibles ('todos' when empty/undefined)
  groupBy?: "status" | "responsavel";
}

function taskMatchesResponsibles(t: Task, responsibles?: string[]) {
  if (!responsibles || responsibles.length === 0) return true;
  const parts = splitResponsibles(t.responsible);
  return parts.some((p) => responsibles.includes(p));
}

export function exportMeetingPdf(
  meeting: Meeting,
  project: ProjectState,
  opts: MeetingExportOpts = {},
) {
  const statuses = opts.statuses && opts.statuses.length ? opts.statuses : STATUS_ORDER;
  const groupBy = opts.groupBy ?? "status";

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const bottomLimit = pageH - 60;

  // Header band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ATA DE REUNIÃO", margin, 32);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(project.projectName, margin, 52);

  let y = 100;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(meeting.title, pageW - margin * 2);
  titleLines.forEach((ln: string) => {
    doc.text(ln, margin, y);
    y += 18;
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(`Data: ${fmtDate(meeting.date)}   |   Gerente: ${project.manager}`, margin, y);
  y += 14;
  const attendeeLines = doc.splitTextToSize(
    `Participantes: ${meeting.attendees}`,
    pageW - margin * 2,
  );
  attendeeLines.forEach((ln: string) => {
    doc.text(ln, margin, y);
    y += 13;
  });
  y += 12;

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = margin;
    }
  };

  const section = (title: string, body: string) => {
    if (!body?.trim()) return;
    ensureSpace(40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND);
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    // Split body into paragraphs / bullets by newlines to keep formatting
    const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);
    paragraphs.forEach((para) => {
      const wrapped = doc.splitTextToSize(`• ${para.trim()}`, pageW - margin * 2 - 10);
      wrapped.forEach((ln: string, i: number) => {
        ensureSpace(14);
        doc.text(ln, margin + (i === 0 ? 0 : 10), y);
        y += 14;
      });
      y += 4;
    });
    y += 6;
  };

  section("Resumo", meeting.summary);
  section("Decisões", meeting.decisions);
  section("Follow-up", meeting.followUp);

  // Tasks table
  const filtered = project.tasks.filter(
    (t) => statuses.includes(t.status) && taskMatchesResponsibles(t, opts.responsibles),
  );

  if (filtered.length > 0) {
    ensureSpace(60);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND);
    doc.text("Status das Tarefas", margin, y);
    y += 8;

    const rows: (string | number)[][] = [];
    if (groupBy === "status") {
      statuses.forEach((st) => {
        filtered
          .filter((t) => t.status === st)
          .forEach((t) =>
            rows.push([
              STATUS_LABEL[st],
              t.title,
              splitResponsibles(t.responsible).join(", "),
              t.deadline ? fmtDate(t.deadline) : "—",
            ]),
          );
      });
    } else {
      const byResp = new Map<string, Task[]>();
      filtered.forEach((t) => {
        splitResponsibles(t.responsible).forEach((r) => {
          if (!byResp.has(r)) byResp.set(r, []);
          byResp.get(r)!.push(t);
        });
      });
      Array.from(byResp.keys())
        .sort()
        .forEach((r) => {
          byResp.get(r)!.forEach((t) =>
            rows.push([
              r,
              t.title,
              STATUS_LABEL[t.status],
              t.deadline ? fmtDate(t.deadline) : "—",
            ]),
          );
        });
    }

    autoTable(doc, {
      startY: y + 6,
      head: [
        groupBy === "status"
          ? ["Status", "Tarefa", "Responsável", "Prazo"]
          : ["Responsável", "Tarefa", "Status", "Prazo"],
      ],
      body: rows,
      styles: { fontSize: 9, cellPadding: 5, textColor: [30, 30, 30], overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 249, 252] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 120 },
        3: { cellWidth: 60 },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  }

  // Risks (open only)
  const openRisks = project.risks.filter((r) => !r.resolved);
  if (openRisks.length) {
    ensureSpace(60);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND);
    doc.text("Riscos em aberto", margin, y);
    autoTable(doc, {
      startY: y + 8,
      head: [["#", "Descrição"]],
      body: openRisks.map((r, i) => [i + 1, r.description]),
      styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
      headStyles: { fillColor: WARN, textColor: 255 },
      columnStyles: { 0: { cellWidth: 30 } },
      margin: { left: margin, right: margin },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `${project.projectName} — Ata ${fmtDate(meeting.date)}   |   Página ${i} de ${pageCount}`,
      margin,
      pageH - 20,
    );
  }

  doc.save(`Ata_${project.projectName.replace(/\s+/g, "_")}_${meeting.date}.pdf`);
}

// ---------- HTML for email ----------
const esc = (s: string) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const bulletList = (s: string) =>
  esc(s || "")
    .split(/\n+/)
    .filter(Boolean)
    .map((l) => `<li style="margin:4px 0;">${l}</li>`)
    .join("");

export function buildMeetingHtml(
  meeting: Meeting,
  project: ProjectState,
  opts: MeetingExportOpts = {},
) {
  const statuses = opts.statuses && opts.statuses.length ? opts.statuses : STATUS_ORDER;
  const groupBy = opts.groupBy ?? "status";

  const filtered = project.tasks.filter(
    (t) => statuses.includes(t.status) && taskMatchesResponsibles(t, opts.responsibles),
  );

  let taskRows = "";
  if (groupBy === "status") {
    taskRows = statuses
      .flatMap((st) =>
        filtered
          .filter((t) => t.status === st)
          .map(
            (t) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${STATUS_LABEL[st]}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(t.title)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(splitResponsibles(t.responsible).join(", "))}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${t.deadline ? fmtDate(t.deadline) : "—"}</td>
      </tr>`,
          ),
      )
      .join("");
  } else {
    const byResp = new Map<string, Task[]>();
    filtered.forEach((t) => {
      splitResponsibles(t.responsible).forEach((r) => {
        if (!byResp.has(r)) byResp.set(r, []);
        byResp.get(r)!.push(t);
      });
    });
    taskRows = Array.from(byResp.keys())
      .sort()
      .flatMap((r) =>
        byResp.get(r)!.map(
          (t) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${esc(r)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(t.title)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${STATUS_LABEL[t.status]}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${t.deadline ? fmtDate(t.deadline) : "—"}</td>
      </tr>`,
        ),
      )
      .join("");
  }

  const openRisks = project.risks.filter((r) => !r.resolved);
  const riskItems = openRisks.map((r) => `<li style="margin:4px 0;">${esc(r.description)}</li>`).join("");

  const cols =
    groupBy === "status"
      ? `<th style="padding:8px;text-align:left;font-size:12px;">Status</th>
         <th style="padding:8px;text-align:left;font-size:12px;">Tarefa</th>
         <th style="padding:8px;text-align:left;font-size:12px;">Responsável</th>
         <th style="padding:8px;text-align:left;font-size:12px;">Prazo</th>`
      : `<th style="padding:8px;text-align:left;font-size:12px;">Responsável</th>
         <th style="padding:8px;text-align:left;font-size:12px;">Tarefa</th>
         <th style="padding:8px;text-align:left;font-size:12px;">Status</th>
         <th style="padding:8px;text-align:left;font-size:12px;">Prazo</th>`;

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1e293b;max-width:820px;">
  <div style="background:#10739E;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
    <div style="font-size:12px;opacity:.85;letter-spacing:.08em;">ATA DE REUNIÃO</div>
    <div style="font-size:20px;font-weight:700;margin-top:2px;">${esc(meeting.title)}</div>
    <div style="font-size:12px;margin-top:6px;opacity:.9;">${esc(project.projectName)} · ${fmtDate(meeting.date)} · ${esc(project.manager)}</div>
  </div>
  <div style="border:1px solid #d5dde5;border-top:none;border-radius:0 0 8px 8px;padding:18px 20px;background:#fff;">
    <p style="margin:0 0 6px;font-size:12px;color:#64748b;"><strong>Participantes:</strong> ${esc(meeting.attendees)}</p>

    ${meeting.summary ? `<h3 style="color:#10739E;margin:18px 0 6px;font-size:14px;border-bottom:2px solid #10739E;padding-bottom:4px;">Resumo</h3>
    <div style="font-size:13px;line-height:1.5;white-space:pre-wrap;">${esc(meeting.summary)}</div>` : ""}

    ${meeting.decisions ? `<h3 style="color:#10739E;margin:18px 0 6px;font-size:14px;border-bottom:2px solid #10739E;padding-bottom:4px;">Decisões</h3>
    <ul style="padding-left:18px;font-size:13px;line-height:1.5;margin:0;">${bulletList(meeting.decisions)}</ul>` : ""}

    ${meeting.followUp ? `<h3 style="color:#10739E;margin:18px 0 6px;font-size:14px;border-bottom:2px solid #10739E;padding-bottom:4px;">Follow-up</h3>
    <ul style="padding-left:18px;font-size:13px;line-height:1.5;margin:0;">${bulletList(meeting.followUp)}</ul>` : ""}

    ${filtered.length ? `<h3 style="color:#10739E;margin:20px 0 8px;font-size:14px;border-bottom:2px solid #10739E;padding-bottom:4px;">Tarefas</h3>
    <table style="border-collapse:collapse;width:100%;">
      <thead><tr style="background:#10739E;color:#fff;">${cols}</tr></thead>
      <tbody>${taskRows}</tbody>
    </table>` : ""}

    ${riskItems ? `<h3 style="color:#d6b656;margin:20px 0 6px;font-size:14px;border-bottom:2px solid #d6b656;padding-bottom:4px;">Riscos em aberto</h3>
    <ul style="padding-left:18px;font-size:13px;line-height:1.5;margin:0;">${riskItems}</ul>` : ""}
  </div>
</div>`;
}

// Build a simple task-only HTML block for follow-up emails
export function buildTaskListHtml(project: ProjectState, opts: MeetingExportOpts = {}) {
  const statuses = opts.statuses && opts.statuses.length ? opts.statuses : STATUS_ORDER;
  const groupBy = opts.groupBy ?? "responsavel";
  const filtered = project.tasks.filter(
    (t) => statuses.includes(t.status) && taskMatchesResponsibles(t, opts.responsibles),
  );

  const cols =
    groupBy === "status"
      ? ["Status", "Tarefa", "Responsável", "Prazo"]
      : ["Responsável", "Tarefa", "Status", "Prazo"];

  let rows = "";
  if (groupBy === "status") {
    rows = statuses
      .flatMap((st) =>
        filtered
          .filter((t) => t.status === st)
          .map(
            (t) => `<tr>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${STATUS_LABEL[st]}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(t.title)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(splitResponsibles(t.responsible).join(", "))}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${t.deadline ? fmtDate(t.deadline) : "—"}</td>
      </tr>`,
          ),
      )
      .join("");
  } else {
    const byResp = new Map<string, Task[]>();
    filtered.forEach((t) => {
      splitResponsibles(t.responsible).forEach((r) => {
        if (!byResp.has(r)) byResp.set(r, []);
        byResp.get(r)!.push(t);
      });
    });
    // Sort each responsible's tasks by deadline (undated last), then by title
    const dateKey = (t: Task) => t.deadline || "9999-12-31";
    rows = Array.from(byResp.keys())
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .flatMap((r) =>
        byResp
          .get(r)!
          .slice()
          .sort((a, b) => dateKey(a).localeCompare(dateKey(b)) || a.title.localeCompare(b.title, "pt-BR"))
          .map(
            (t) => `<tr>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${esc(r)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(t.title)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${STATUS_LABEL[t.status]}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;">${t.deadline ? fmtDate(t.deadline) : "—"}</td>
      </tr>`,
          ),
      )
      .join("");
  }

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1e293b;max-width:820px;">
  <div style="background:#10739E;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;">
    <div style="font-size:12px;opacity:.85;letter-spacing:.08em;">ACOMPANHAMENTO DE TAREFAS</div>
    <div style="font-size:18px;font-weight:700;margin-top:2px;">${esc(project.projectName)}</div>
    <div style="font-size:12px;margin-top:4px;opacity:.9;">Gerente: ${esc(project.manager)} · ${new Date().toLocaleDateString("pt-BR")}</div>
  </div>
  <div style="border:1px solid #d5dde5;border-top:none;border-radius:0 0 8px 8px;padding:16px 18px;background:#fff;">
    <p style="font-size:13px;margin:0 0 10px;">Segue abaixo o status atual das tarefas para acompanhamento. Favor validar as atividades sob sua responsabilidade.</p>
    <table style="border-collapse:collapse;width:100%;">
      <thead><tr style="background:#10739E;color:#fff;">
        ${cols.map((c) => `<th style="padding:8px;text-align:left;font-size:12px;">${c}</th>`).join("")}
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="4" style="padding:10px;font-size:12px;color:#64748b;">Nenhuma tarefa nos filtros selecionados.</td></tr>`}</tbody>
    </table>
  </div>
</div>`;
}

// ---------- Clipboard helpers ----------
async function copyHtmlFallback(html: string, completeDocument = false): Promise<boolean> {
  // Minutes exports already provide their complete document. Reusing it
  // byte-for-byte prevents the downloaded HTML and clipboard versions from
  // acquiring different body spacing or wrappers.
  const doc = completeDocument
    ? html
    : `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#ffffff;">${html}</body></html>`;
  const plain = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(tr|p|div|li|h[1-6]|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 1) Modern async Clipboard with rich HTML
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([doc], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch {}

  // 2) copy event with explicit clipboardData (keeps markup byte-for-byte)
  try {
    let ok = false;
    const handler = (e: ClipboardEvent) => {
      e.clipboardData?.setData("text/html", doc);
      e.clipboardData?.setData("text/plain", plain);
      e.preventDefault();
      ok = true;
    };
    document.addEventListener("copy", handler, true);
    // a selection is required for execCommand('copy') to fire
    const dummy = document.createElement("div");
    dummy.textContent = " ";
    dummy.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
    document.body.appendChild(dummy);
    const range = document.createRange();
    range.selectNodeContents(dummy);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand("copy");
    sel?.removeAllRanges();
    dummy.remove();
    document.removeEventListener("copy", handler, true);
    if (ok) return true;
  } catch {}


  // 3) Plain text fallback
  try {
    const plain = html.replace(/<[^>]+>/g, "");
    await navigator.clipboard.writeText(plain);
    return true;
  } catch {
    return false;
  }
}

export async function copyMeetingHtmlToClipboard(
  meeting: Meeting,
  project: ProjectState,
  opts?: MeetingExportOpts,
) {
  return copyHtmlFallback(buildMeetingHtml(meeting, project, opts));
}

export async function copyTaskListHtmlToClipboard(project: ProjectState, opts?: MeetingExportOpts) {
  return copyHtmlFallback(buildTaskListHtml(project, opts));
}

export function downloadMeetingHtml(
  meeting: Meeting,
  project: ProjectState,
  opts?: MeetingExportOpts,
) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ata ${meeting.date}</title></head><body>${buildMeetingHtml(meeting, project, opts)}</body></html>`;
  triggerDownload(html, `Ata_${project.projectName.replace(/\s+/g, "_")}_${meeting.date}.html`, "text/html");
}

// ---------- Schedule exports ----------
const scheduleStatusColor: Record<ScheduleStatus, [number, number, number]> = {
  nao_iniciada: [100, 116, 139],
  em_andamento: [214, 158, 46],
  finalizada: [47, 133, 90],
  atrasada: [197, 48, 48],
};

export interface ScheduleExportOpts {
  statuses?: ScheduleStatus[]; // filter
}

function filteredSchedule(items: ScheduleItem[], opts: ScheduleExportOpts = {}): ScheduleItem[] {
  const st = opts.statuses;
  if (!st || st.length === 0 || st.length === SCHEDULE_STATUS_ORDER.length) return items;
  // Keep groups whose children match
  const keep = new Set<string>();
  items.forEach((it) => {
    if (!it.isGroup && st.includes(it.status)) keep.add(it.id);
  });
  // Add parent groups by wbs prefix
  const parents = new Set<string>();
  items.forEach((it) => {
    if (it.isGroup) {
      const hasChild = items.some(
        (c) => !c.isGroup && c.wbs.startsWith(it.wbs + ".") && keep.has(c.id),
      );
      if (hasChild) parents.add(it.id);
    }
  });
  return items.filter((it) => keep.has(it.id) || parents.has(it.id));
}

export function exportSchedulePdf(project: ProjectState, opts: ScheduleExportOpts = {}) {
  const items = filteredSchedule(project.schedule, opts);
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;

  // Header
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CRONOGRAMA DO PROJETO", margin, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(project.projectName, margin, 46);

  const rows = items.map((it) => {
    const indent = "  ".repeat(Math.max(0, it.wbs.split(".").length - 1));
    return [
      it.wbs,
      `${indent}${it.name}`,
      it.duration ?? "—",
      fmtDate(it.start),
      fmtDate(it.finish),
      it.isGroup ? "—" : SCHEDULE_STATUS_LABEL[it.status],
    ];
  });

  autoTable(doc, {
    startY: 80,
    head: [["WBS", "Tarefa", "Duração", "Início", "Fim", "Status"]],
    body: rows,
    styles: { fontSize: 8.5, cellPadding: 4, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 249, 252] },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 240 },
      2: { cellWidth: 60 },
      3: { cellWidth: 60 },
      4: { cellWidth: 60 },
      5: { cellWidth: 90 },
    },
    tableWidth: "wrap",
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      const item = items[data.row.index];
      if (!item) return;
      if (item.isGroup) {
        data.cell.styles.fillColor = [225, 236, 244];
        data.cell.styles.textColor = BRAND;
        data.cell.styles.fontStyle = "bold";
      } else if (data.column.index === 5) {
        const c = scheduleStatusColor[item.status];
        data.cell.styles.fillColor = c;
        data.cell.styles.textColor = 255;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `${project.projectName} — Cronograma   |   Página ${i} de ${pageCount}`,
      margin,
      pageH - 16,
    );
  }

  doc.save(`Cronograma_${project.projectName.replace(/\s+/g, "_")}.pdf`);
}

export function buildScheduleHtml(project: ProjectState, opts: ScheduleExportOpts = {}) {
  const items = filteredSchedule(project.schedule, opts);
  const colorHex: Record<ScheduleStatus, string> = {
    nao_iniciada: "#64748b",
    em_andamento: "#d69e2e",
    finalizada: "#2f855a",
    atrasada: "#c53030",
  };
  const rows = items
    .map((it) => {
      if (it.isGroup) {
        return `<tr style="background:#e1ecf4;color:#10739E;font-weight:700;">
          <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(it.wbs)}</td>
          <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(it.name)}</td>
          <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(it.duration ?? "—")}</td>
          <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${fmtDate(it.start)}</td>
          <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${fmtDate(it.finish)}</td>
          <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">—</td>
        </tr>`;
      }
      const indent = (it.wbs.split(".").length - 1) * 12;
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(it.wbs)}</td>
        <td style="padding:6px 8px 6px ${8 + indent}px;border:1px solid #d5dde5;font-size:12px;">${esc(it.name)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(it.duration ?? "—")}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${fmtDate(it.start)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${fmtDate(it.finish)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;color:#fff;background:${colorHex[it.status]};font-weight:600;">${SCHEDULE_STATUS_LABEL[it.status]}</td>
      </tr>`;
    })
    .join("");

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1e293b;">
  <div style="background:#10739E;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;">
    <div style="font-size:12px;opacity:.85;letter-spacing:.08em;">CRONOGRAMA</div>
    <div style="font-size:18px;font-weight:700;">${esc(project.projectName)}</div>
  </div>
  <table style="border-collapse:collapse;width:100%;border:1px solid #d5dde5;border-top:none;table-layout:fixed;">
    <colgroup>
      <col style="width:52px;" />
      <col style="width:34%;" />
      <col style="width:70px;" />
      <col style="width:82px;" />
      <col style="width:82px;" />
      <col style="width:110px;" />
    </colgroup>
    <thead><tr style="background:#10739E;color:#fff;">
      <th style="padding:8px;text-align:left;font-size:12px;">WBS</th>
      <th style="padding:8px;text-align:left;font-size:12px;">Tarefa</th>
      <th style="padding:8px;text-align:left;font-size:12px;">Duração</th>
      <th style="padding:8px;text-align:left;font-size:12px;">Início</th>
      <th style="padding:8px;text-align:left;font-size:12px;">Fim</th>
      <th style="padding:8px;text-align:left;font-size:12px;">Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

export function downloadScheduleHtml(project: ProjectState, opts?: ScheduleExportOpts) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cronograma — ${esc(project.projectName)}</title></head><body>${buildScheduleHtml(project, opts)}</body></html>`;
  triggerDownload(html, `Cronograma_${project.projectName.replace(/\s+/g, "_")}.html`, "text/html");
}

// ---------- Timeline (visual) ----------
export interface TimelineExportOpts {
  statuses?: TaskStatus[];
  responsibles?: string[];
}

const taskStatusHex: Record<TaskStatus, string> = {
  finalizado: "#2f855a",
  em_andamento: "#d69e2e",
  a_iniciar: "#3182ce",
  caminho_critico: "#c53030",
};

function filterTimelineTasks(project: ProjectState, opts: TimelineExportOpts = {}) {
  const statuses = opts.statuses && opts.statuses.length ? opts.statuses : STATUS_ORDER;
  const responsibles = opts.responsibles && opts.responsibles.length ? opts.responsibles : [];
  return project.tasks
    .filter((t) => {
      if (!statuses.includes(t.status)) return false;
      if (responsibles.length === 0) return true;
      const parts = splitResponsibles(t.responsible);
      return parts.some((p) => responsibles.includes(p));
    })
    .slice()
    .sort((a, b) => {
      const ad = a.deadline || "9999-99-99";
      const bd = b.deadline || "9999-99-99";
      return ad.localeCompare(bd);
    });
}


const monthLabel = (iso: string) => {
  const [y, m] = iso.split("-");
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${meses[Number(m) - 1]}/${y.slice(2)}`;
};

export function buildTimelineHtml(project: ProjectState, opts: TimelineExportOpts = {}) {
  const tasks = filterTimelineTasks(project, opts);
  let lastMonth = "";
  const rows = tasks
    .map((t) => {
      const iso = t.deadline;
      const month = iso ? iso.slice(0, 7) : "sem-data";
      const showMonth = month !== lastMonth;
      lastMonth = month;
      const color = taskStatusHex[t.status];
      const parts = splitResponsibles(t.responsible);
      const respHtml = parts.length
        ? parts
            .map(
              (r) =>
                `<span style="display:inline-block;background:#e2e8f0;color:#334155;font-size:11px;padding:2px 8px;border-radius:10px;margin:1px 3px 1px 0;">${esc(r)}</span>`,
            )
            .join("")
        : `<span style="color:#94a3b8;font-size:11px;font-style:italic;">Sem responsável</span>`;
      const monthTitle = iso ? monthLabel(iso) : "Sem data definida";
      const dateCell = iso ? fmtDate(iso) : "—";
      return `${
        showMonth
          ? `<div style="margin:16px 0 6px 0;font-size:11px;letter-spacing:.08em;color:#10739E;font-weight:700;text-transform:uppercase;">${monthTitle}</div>`
          : ""
      }
      <div data-task-id="${t.id}" style="display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-left:2px solid #e2e8f0;padding-left:14px;margin-left:6px;position:relative;cursor:pointer;border-radius:4px;" title="Clique para editar">
        <div style="position:absolute;left:-7px;top:14px;width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px ${color};"></div>
        <div style="min-width:78px;font-size:12px;color:#475569;font-weight:600;padding-top:2px;">${dateCell}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;color:#0f172a;">${esc(t.title)}</div>
          <div style="margin-top:4px;">${respHtml}</div>
        </div>
        <div style="background:${color};color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:10px;white-space:nowrap;align-self:flex-start;">${STATUS_LABEL[t.status]}</div>
      </div>`;
    })
    .join("");

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1e293b;max-width:900px;background:#ffffff;">
    <div style="background:#10739E;color:#ffffff;padding:14px 18px;border-radius:8px 8px 0 0;">
      <div style="font-size:12px;opacity:.85;letter-spacing:.08em;">LINHA DO TEMPO</div>
      <div style="font-size:18px;font-weight:700;">${esc(project.projectName)}</div>
      <div style="font-size:12px;margin-top:4px;opacity:.9;">Gerente: ${esc(project.manager)} · ${new Date().toLocaleDateString("pt-BR")}</div>
    </div>
    <div style="border:1px solid #d5dde5;border-top:none;border-radius:0 0 8px 8px;padding:8px 20px 24px;background:#ffffff;">
      ${
        tasks.length === 0
          ? `<p style="font-size:13px;color:#64748b;padding:20px 0;">Nenhuma tarefa nos status selecionados.</p>`
          : rows
      }
    </div>
  </div>`;
}

export function downloadTimelineHtml(project: ProjectState, opts?: TimelineExportOpts) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Linha do tempo — ${esc(project.projectName)}</title></head><body style="margin:0;padding:24px;background:#f8fafc;">${buildTimelineHtml(project, opts)}</body></html>`;
  triggerDownload(html, `LinhaDoTempo_${project.projectName.replace(/\s+/g, "_")}.html`, "text/html");
}

// Horizontal timeline (cards arranged in a row per month band)
export function buildTimelineHtmlHorizontal(project: ProjectState, opts: TimelineExportOpts = {}) {
  const tasks = filterTimelineTasks(project, opts);
  // Group by month
  const groups = new Map<string, Task[]>();
  tasks.forEach((t) => {
    const key = t.deadline ? t.deadline.slice(0, 7) : "sem-data";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });
  const keys = Array.from(groups.keys()).sort();

  const columns = keys
    .map((k) => {
      const title = k === "sem-data" ? "Sem data" : monthLabel(k + "-01");
      const cards = groups
        .get(k)!
        .map((t) => {
          const color = taskStatusHex[t.status];
          const parts = splitResponsibles(t.responsible);
          const resp = parts.length
            ? parts.map((r) => esc(r)).join(", ")
            : "Sem responsável";
          return `<div data-task-id="${t.id}" title="Clique para editar" style="border:1px solid #e2e8f0;border-left:4px solid ${color};border-radius:6px;padding:8px 10px;margin-bottom:8px;background:#fff;cursor:pointer;">
            <div style="font-size:11px;color:#64748b;font-weight:600;">${t.deadline ? fmtDate(t.deadline) : "—"}</div>
            <div style="font-size:12px;font-weight:600;color:#0f172a;margin:2px 0 4px;line-height:1.25;">${esc(t.title)}</div>
            <div style="font-size:10px;color:#475569;margin-bottom:4px;">${esc(resp)}</div>
            <div style="display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;">${STATUS_LABEL[t.status]}</div>
          </div>`;
        })
        .join("");
      return `<div style="min-width:200px;max-width:220px;flex:0 0 210px;">
        <div style="font-size:11px;letter-spacing:.08em;color:#10739E;font-weight:700;text-transform:uppercase;text-align:center;padding:6px;background:#e1ecf4;border-radius:6px;margin-bottom:8px;">${title}</div>
        ${cards}
      </div>`;
    })
    .join("");

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1e293b;background:#ffffff;">
    <div style="background:#10739E;color:#ffffff;padding:12px 16px;border-radius:6px 6px 0 0;">
      <div style="font-size:11px;opacity:.85;letter-spacing:.08em;">LINHA DO TEMPO</div>
      <div style="font-size:16px;font-weight:700;">${esc(project.projectName)}</div>
      <div style="font-size:11px;margin-top:2px;opacity:.9;">Gerente: ${esc(project.manager)} · ${new Date().toLocaleDateString("pt-BR")}</div>
    </div>
    <div style="border:1px solid #d5dde5;border-top:none;border-radius:0 0 6px 6px;padding:16px;background:#fff;">
      ${
        tasks.length === 0
          ? `<p style="font-size:13px;color:#64748b;padding:20px 0;">Nenhuma tarefa nos status selecionados.</p>`
          : `<div style="display:flex;gap:12px;align-items:flex-start;">${columns}</div>`
      }
    </div>
  </div>`;
}

async function renderHtmlOffscreen(html: string, widthPx: number): Promise<HTMLCanvasElement> {
  // Render inside an isolated iframe so the app's Tailwind v4 stylesheet
  // (which uses oklch() colors that html2canvas cannot parse) never applies.
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = `position:fixed;left:0;top:0;z-index:-1;opacity:0;pointer-events:none;border:0;width:${widthPx}px;height:100px;`;
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><style>
        *{box-sizing:border-box;}
        html,body{margin:0;padding:0;background:#ffffff;color:#1e293b;font-family:Segoe UI,Arial,sans-serif;}
        body{width:${widthPx}px;padding:16px;}
      </style></head><body><div id="root">${html}</div></body></html>`,
    );
    doc.close();

    await new Promise((r) => setTimeout(r, 60));
    const win = iframe.contentWindow!;
    if (doc.fonts?.ready) await doc.fonts.ready.catch(() => undefined);

    const root = doc.body;
    const height = Math.max(1, Math.ceil(root.scrollHeight));
    iframe.style.height = `${height}px`;
    await new Promise((r) => setTimeout(r, 30));

    const { default: html2canvas } = await import("html2canvas");
    const scale = Math.min(2, Math.max(1, 30000 / Math.max(height, widthPx)));
    return await html2canvas(root, {
      backgroundColor: "#ffffff",
      scale,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: widthPx,
      height,
      windowWidth: widthPx,
      windowHeight: height,
      // render against the iframe document
      foreignObjectRendering: false,
      // @ts-expect-error html2canvas accepts a custom window/document context
      ownerDocument: doc,
      onclone: (cloned: Document) => {
        cloned.body.style.width = `${widthPx}px`;
        void win;
      },
    });
  } finally {
    iframe.remove();
  }
}


export async function exportTimelinePng(
  project: ProjectState,
  opts: TimelineExportOpts = {},
  orientation: "portrait" | "landscape" = "portrait",
) {
  const html =
    orientation === "landscape"
      ? buildTimelineHtmlHorizontal(project, opts)
      : buildTimelineHtml(project, opts);
  const width = orientation === "landscape" ? 1600 : 900;
  const canvas = await renderHtmlOffscreen(html, width);
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `LinhaDoTempo_${project.projectName.replace(/\s+/g, "_")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportTimelinePdf(
  project: ProjectState,
  opts: TimelineExportOpts = {},
  orientation: "portrait" | "landscape" = "portrait",
) {
  const html =
    orientation === "landscape"
      ? buildTimelineHtmlHorizontal(project, opts)
      : buildTimelineHtml(project, opts);
  const width = orientation === "landscape" ? 1600 : 900;
  const canvas = await renderHtmlOffscreen(html, width);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  // Fit to single page preserving aspect ratio
  const canvasRatio = canvas.width / canvas.height;
  const availRatio = availW / availH;
  let imgW: number, imgH: number;
  if (canvasRatio > availRatio) {
    imgW = availW;
    imgH = imgW / canvasRatio;
  } else {
    imgH = availH;
    imgW = imgH * canvasRatio;
  }
  const x = margin + (availW - imgW) / 2;
  const y = margin + (availH - imgH) / 2;
  pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
  pdf.save(`LinhaDoTempo_${project.projectName.replace(/\s+/g, "_")}.pdf`);
}

// ---------- History exports ----------
export function buildHistoryHtml(project: ProjectState) {
  const rows = project.history
    .map((h) => {
      let d = "";
      try {
        d = new Date(h.date).toLocaleString("pt-BR");
      } catch {
        d = h.date;
      }
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;white-space:nowrap;color:#64748b;">${esc(d)}</td>
        <td style="padding:6px 8px;border:1px solid #d5dde5;font-size:12px;">${esc(h.text)}</td>
      </tr>`;
    })
    .join("");
  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1e293b;background:#ffffff;">
    <div style="background:#10739E;color:#fff;padding:14px 18px;border-radius:6px 6px 0 0;">
      <div style="font-size:12px;opacity:.85;letter-spacing:.08em;">HISTÓRICO DE ALTERAÇÕES</div>
      <div style="font-size:18px;font-weight:700;">${esc(project.projectName)}</div>
      <div style="font-size:12px;margin-top:4px;opacity:.9;">Gerente: ${esc(project.manager)} · ${new Date().toLocaleDateString("pt-BR")}</div>
    </div>
    <table style="border-collapse:collapse;width:100%;border:1px solid #d5dde5;border-top:none;">
      <thead><tr style="background:#10739E;color:#fff;">
        <th style="padding:8px;text-align:left;font-size:12px;width:180px;">Data</th>
        <th style="padding:8px;text-align:left;font-size:12px;">Descrição</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="2" style="padding:12px;font-size:12px;color:#64748b;">Sem entradas.</td></tr>`}</tbody>
    </table>
  </div>`;
}

export function downloadHistoryHtml(project: ProjectState) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Histórico — ${esc(project.projectName)}</title></head><body style="margin:0;padding:24px;background:#f8fafc;">${buildHistoryHtml(project)}</body></html>`;
  triggerDownload(html, `Historico_${project.projectName.replace(/\s+/g, "_")}.html`, "text/html");
}

export async function exportHistoryPng(project: ProjectState) {
  const canvas = await renderHtmlOffscreen(buildHistoryHtml(project), 900);
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `Historico_${project.projectName.replace(/\s+/g, "_")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportHistoryPdf(project: ProjectState) {
  const canvas = await renderHtmlOffscreen(buildHistoryHtml(project), 900);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  const imgW = availW;
  const imgH = (canvas.height * imgW) / canvas.width;
  if (imgH <= availH) {
    pdf.addImage(imgData, "PNG", margin, margin, imgW, imgH);
  } else {
    const pxPerPage = (availH / imgW) * canvas.width;
    let offset = 0;
    while (offset < canvas.height) {
      const sliceH = Math.min(pxPerPage, canvas.height - offset);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, offset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      const data = slice.toDataURL("image/png");
      const h = (sliceH / canvas.width) * imgW;
      if (offset > 0) pdf.addPage();
      pdf.addImage(data, "PNG", margin, margin, imgW, h);
      offset += sliceH;
    }
  }
  pdf.save(`Historico_${project.projectName.replace(/\s+/g, "_")}.pdf`);
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Ata completa para corpo de e-mail ----------
export interface MinutesEmailOpts {
  date?: string; // ISO
  attendees?: string;
  greeting?: string;
  includeSchedule?: boolean;
  includeTasks?: boolean;
  includeTimeline?: boolean;
  includeRisks?: boolean;
}

const EM_FONT = "font-family:'Segoe UI',Calibri,Arial,sans-serif;";

function minutesScheduleTable(project: ProjectState) {
  const colorHex: Record<ScheduleStatus, string> = {
    nao_iniciada: "#64748b",
    em_andamento: "#d69e2e",
    finalizada: "#2f855a",
    atrasada: "#c53030",
  };
  const rows = project.schedule
    .map((it) => {
      const base = "padding:5px 7px;border:1px solid #cbd5e1;font-size:11px;";
      if (it.isGroup) {
        return `<tr style="background:#e1ecf4;color:#0b5a7d;font-weight:700;">
          <td style="${base}">${esc(it.wbs)}</td>
          <td style="${base}">${esc(it.name)}</td>
          <td style="${base}text-align:center;">${esc(it.duration ?? "—")}</td>
          <td style="${base}text-align:center;white-space:nowrap;">${fmtDate(it.start)}</td>
          <td style="${base}text-align:center;white-space:nowrap;">${fmtDate(it.finish)}</td>
          <td style="${base}text-align:center;color:#ffffff;background:${colorHex[it.status]};white-space:nowrap;font-size:10px;">${SCHEDULE_STATUS_LABEL[it.status]}</td>
        </tr>`;
      }
      const indent = (it.wbs.split(".").length - 1) * 10;
      return `<tr>
        <td style="${base}">${esc(it.wbs)}</td>
        <td style="${base}padding-left:${7 + indent}px;">${esc(it.name)}</td>
        <td style="${base}text-align:center;">${esc(it.duration ?? "—")}</td>
        <td style="${base}text-align:center;white-space:nowrap;">${fmtDate(it.start)}</td>
        <td style="${base}text-align:center;white-space:nowrap;">${fmtDate(it.finish)}</td>
        <td style="${base}text-align:center;color:#ffffff;background:${colorHex[it.status]};font-weight:600;white-space:nowrap;font-size:10px;">${SCHEDULE_STATUS_LABEL[it.status]}</td>
      </tr>`;
    })
    .join("");

  return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:800px;table-layout:fixed;${EM_FONT}">
    <colgroup>
      <col style="width:38px;" /><col /><col style="width:68px;" /><col style="width:81px;" /><col style="width:81px;" /><col style="width:104px;" />
    </colgroup>
    <thead><tr style="background:#10739E;color:#ffffff;">
      <th style="padding:6px 7px;text-align:left;font-size:11px;">WBS</th>
      <th style="padding:6px 7px;text-align:left;font-size:11px;">Tarefa</th>
      <th style="padding:6px 7px;text-align:center;font-size:11px;">Duração</th>
      <th style="padding:6px 7px;text-align:center;font-size:11px;">Início</th>
      <th style="padding:6px 7px;text-align:center;font-size:11px;">Fim</th>
      <th style="padding:6px 7px;text-align:center;font-size:11px;">Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function minutesTasksTable(project: ProjectState) {
  const statuses: TaskStatus[] = ["caminho_critico", "em_andamento", "a_iniciar"];
  const byResp = new Map<string, Task[]>();
  project.tasks
    .filter((t) => statuses.includes(t.status))
    .forEach((t) => {
      const parts = splitResponsibles(t.responsible);
      (parts.length ? parts : ["Sem responsável"]).forEach((r) => {
        if (!byResp.has(r)) byResp.set(r, []);
        byResp.get(r)!.push(t);
      });
    });

  const rows = Array.from(byResp.keys())
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .flatMap((r) =>
      byResp
        .get(r)!
        .slice()
        .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"))
        .map((t) => {
          const base = "padding:5px 7px;border:1px solid #cbd5e1;font-size:11px;vertical-align:top;";
          return `<tr>
            <td style="${base}white-space:nowrap;font-weight:600;">${esc(r)}</td>
            <td style="${base}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">${esc(t.title)}</td>
            <td style="${base}text-align:center;color:#ffffff;background:${taskStatusHex[t.status]};font-weight:600;white-space:nowrap;">${STATUS_LABEL[t.status]}</td>
            <td style="${base}text-align:center;white-space:nowrap;">${t.deadline ? fmtDate(t.deadline) : "—"}</td>
          </tr>`;
        }),
    )
    .join("");

  return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:800px;table-layout:fixed;${EM_FONT}">
    <colgroup><col style="width:112px;" /><col /><col style="width:100px;" /><col style="width:66px;" /></colgroup>
    <thead><tr style="background:#10739E;color:#ffffff;">
      <th style="padding:6px 7px;text-align:left;font-size:11px;">Responsável</th>
      <th style="padding:6px 7px;text-align:left;font-size:11px;">Tarefa</th>
      <th style="padding:6px 7px;font-size:11px;">Status</th>
      <th style="padding:6px 7px;font-size:11px;">Prazo</th>
    </tr></thead>
    <tbody>${rows || `<tr><td colspan="4" style="padding:8px;font-size:11px;color:#64748b;border:1px solid #cbd5e1;">Nenhuma tarefa pendente.</td></tr>`}</tbody>
  </table>`;
}

function minutesTimelineTable(project: ProjectState) {
  const statuses: TaskStatus[] = ["caminho_critico", "em_andamento", "a_iniciar"];
  const tasks = filterTimelineTasks(project, { statuses })
    .slice()
    .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
  if (!tasks.length)
    return `<p style="font-size:12px;color:#64748b;${EM_FONT}">Nenhuma tarefa pendente na linha do tempo.</p>`;

  let lastMonth = "";
  // Continuous vertical line = border-left on the first cell of every row
  const LINE = "border-left:2px solid #e2e8f0;";
  const rows = tasks
    .map((t) => {
      const key = t.deadline ? t.deadline.slice(0, 7) : "sem-data";
      let head = "";
      if (key !== lastMonth) {
        lastMonth = key;
        const title = key === "sem-data" ? "SEM DATA" : monthLabel(key + "-01").toUpperCase();
        head = `<tr>
          <td width="18" style="width:18px;padding:0;font-size:0;line-height:0;${LINE}">&nbsp;</td>
          <td colspan="3" style="padding:12px 10px 4px;font-size:10px;font-weight:700;letter-spacing:.08em;color:#0b5a7d;${EM_FONT}">${title}</td>
        </tr>`;
      }
      const color = taskStatusHex[t.status];
      const resp = splitResponsibles(t.responsible);
      const chips = resp.length
        ? `<table cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-top:3px;"><tr>${resp
            .map(
              (r, i) =>
                `${i ? `<td width="5" style="width:5px;font-size:0;line-height:0;">&nbsp;</td>` : ""}<td bgcolor="#eef2f6" style="background:#eef2f6;color:#475569;font-size:9px;padding:2px 7px;border-radius:9px;white-space:nowrap;${EM_FONT}">${esc(r)}</td>`,
            )
            .join("")}</tr></table>`
        : "";
      // Dot sits next to the connecting line (no absolute positioning / box-shadow)
      const dot = `<table cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-top:7px;"><tr><td width="9" height="9" bgcolor="${color}" style="width:9px;height:9px;background:${color};border-radius:50%;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
      return `${head}<tr>
        <td width="18" style="width:18px;padding:0 0 0 3px;vertical-align:top;${LINE}">${dot}</td>
        <td width="78" style="width:78px;padding:4px 8px 8px 4px;vertical-align:top;font-size:10px;color:#64748b;white-space:nowrap;${EM_FONT}">${t.deadline ? fmtDate(t.deadline) : "—"}</td>
        <td style="padding:4px 8px 8px;vertical-align:top;${EM_FONT}">
          <div style="font-size:11px;color:#0f172a;line-height:1.3;">${esc(t.title)}</div>
          ${chips}
        </td>
        <td width="110" style="width:110px;padding:6px 8px 8px;vertical-align:top;${EM_FONT}">
          <table cellspacing="0" cellpadding="0" border="0" align="right" style="border-collapse:collapse;"><tr><td bgcolor="${color}" style="background:${color};color:#ffffff;font-size:9px;font-weight:600;padding:3px 8px;border-radius:9px;white-space:nowrap;${EM_FONT}">${STATUS_LABEL[t.status]}</td></tr></table>
        </td>
      </tr>`;
    })
    .join("");

  return `<table cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;width:100%;max-width:800px;border:1px solid #e2e8f0;${EM_FONT}">
    <tr><td bgcolor="#10739E" style="background:#10739E;padding:10px 12px;${EM_FONT}">
      <div style="font-size:9px;letter-spacing:.1em;color:#cfe4ef;">LINHA DO TEMPO</div>
      <div style="font-size:15px;font-weight:700;color:#ffffff;">${esc(project.projectName)}</div>
      <div style="font-size:10px;color:#cfe4ef;">Gerente: ${esc(project.manager)}</div>
    </td></tr>
    <tr><td style="padding:0;">
      <table cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;width:100%;table-layout:fixed;${EM_FONT}"><colgroup><col style="width:18px;" /><col style="width:78px;" /><col /><col style="width:110px;" /></colgroup><tbody>${rows}</tbody></table>
    </td></tr>
  </table>`;
}

function minutesRisksTable(project: ProjectState) {
  const items = project.risks.filter((r) => !r.resolved);
  if (!items.length)
    return `<p style="font-size:12px;color:#64748b;${EM_FONT}">Nenhum risco em aberto.</p>`;
  const lis = items
    .map((r) => {
      const comments = (r.comments ?? []).map((c) => esc(c.text)).join(" · ");
      return `<li style="font-size:11px;color:#1e293b;margin:0 0 7px;line-height:1.35;">${esc(r.description)}${comments ? `<span style="color:#64748b;"> — ${comments}</span>` : ""}</li>`;
    })
    .join("");
  return `<ul style="margin:6px 0 0;padding-left:20px;${EM_FONT}">${lis}</ul>`;
}

const sectionTitle = (text: string, color = "#10739E") =>
  `<p style="${EM_FONT}font-size:13px;font-weight:700;color:${color};margin:20px 0 6px;border-bottom:1px solid ${color};padding-bottom:3px;">${esc(text)}</p>`;

export function buildMinutesEmailHtml(project: ProjectState, opts: MinutesEmailOpts = {}) {
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const {
    includeSchedule = true,
    includeTasks = true,
    includeTimeline = true,
    includeRisks = true,
  } = opts;

  return `<div style="${EM_FONT}color:#1e293b;font-size:12px;line-height:1.45;max-width:800px;">
  <p style="margin:0 0 12px;">${esc(opts.greeting || "Olá, bom dia")}</p>
  <p style="margin:0 0 12px;">Segue ata do nosso último encontro – ${fmtDate(date)}.</p>
  ${opts.attendees ? `<p style="margin:0 0 12px;"><strong>Participantes:</strong> ${esc(opts.attendees)}</p>` : ""}

  ${includeSchedule ? sectionTitle("Cronograma") + minutesScheduleTable(project) : ""}
  ${includeTasks ? sectionTitle("To do") + minutesTasksTable(project) : ""}
  ${includeTimeline ? sectionTitle("Priorização do To Do") + minutesTimelineTable(project) : ""}
  ${includeRisks ? sectionTitle("Riscos em aberto", "#b8912f") + minutesRisksTable(project) : ""}

  <p style="margin:22px 0 0;font-size:12px;">Atenciosamente,<br />${esc(project.manager)}</p>
</div>`;
}

function buildMinutesEmailDocument(project: ProjectState, opts: MinutesEmailOpts = {}) {
  const content = buildMinutesEmailHtml(project, opts);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ata — ${esc(project.projectName)}</title></head><body style="margin:0;padding:0;background:#ffffff;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#ffffff;"><tr><td align="left" style="padding:24px;background:#ffffff;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="800" style="width:800px;max-width:800px;border-collapse:collapse;"><tr><td style="padding:0;">${content}</td></tr></table></td></tr></table></body></html>`;
}

export async function copyMinutesEmailHtml(project: ProjectState, opts?: MinutesEmailOpts) {
  return copyHtmlFallback(buildMinutesEmailDocument(project, opts), true);
}

export function downloadMinutesEmailHtml(project: ProjectState, opts?: MinutesEmailOpts) {
  const date = opts?.date || new Date().toISOString().slice(0, 10);
  const html = buildMinutesEmailDocument(project, opts);
  triggerDownload(html, `Ata_Email_${project.projectName.replace(/\s+/g, "_")}_${date}.html`, "text/html");
}

export async function exportMinutesEmailPdf(project: ProjectState, opts?: MinutesEmailOpts) {
  const canvas = await renderHtmlOffscreen(buildMinutesEmailHtml(project, opts), 800);
  if (!canvas.width || !canvas.height) throw new Error("Falha ao renderizar a ata para PDF.");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  const pxPerPage = Math.max(1, Math.floor((availH / imgW) * canvas.width));
  let offset = 0;
  let page = 0;
  while (offset < canvas.height) {
    const sliceH = Math.min(pxPerPage, canvas.height - offset);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, offset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    const h = (sliceH / canvas.width) * imgW;
    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, h);
    offset += sliceH;
    page += 1;
  }
  const date = opts?.date || new Date().toISOString().slice(0, 10);
  pdf.save(`Ata_${project.projectName.replace(/\s+/g, "_")}_${date}.pdf`);
}

