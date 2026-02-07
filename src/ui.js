import { getLatestGeometryDate } from "./map.js";

export function debounce(fn, ms = 200) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function setStatusBanner({ show, text }) {
  const banner = document.getElementById("statusBanner");
  const label = document.getElementById("statusBannerText");
  if (!banner || !label) return;

  if (show) {
    label.textContent = text ?? "";
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }
}

export function renderControls({ categories, state, onChange }) {
  const root = document.getElementById("controls");
  root.innerHTML = "";

  const statusWrap = el("div", "control");
  statusWrap.append(el("label", null, "Status"));
  const statusSel = document.createElement("select");
  for (const v of ["open", "closed", "all"]) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v.toUpperCase();
    statusSel.appendChild(opt);
  }
  statusSel.value = state.status;
  statusSel.addEventListener("change", () => onChange({ status: statusSel.value }));
  statusWrap.append(statusSel);

  const limitWrap = el("div", "control");
  limitWrap.append(el("label", null, "Limit"));
  const limitSel = document.createElement("select");
  for (const v of [25, 50, 100]) {
    const opt = document.createElement("option");
    opt.value = String(v);
    opt.textContent = String(v);
    limitSel.appendChild(opt);
  }
  limitSel.value = String(state.limit);
  limitSel.addEventListener("change", () => onChange({ limit: Number(limitSel.value) }));
  limitWrap.append(limitSel);

  const catsWrap = el("div", "control");
  catsWrap.append(el("label", null, "Categories"));
  const pills = el("div", "pills");

  const sorted = [...categories].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));

  for (const c of sorted) {
    const id = c.id;
    const title = c.title ?? `Category ${id}`;
    const pill = el("div", "pill", title);
    if (state.categoryIds.includes(id)) pill.classList.add("is-on");

    pill.addEventListener("click", () => {
      const next = new Set(state.categoryIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onChange({ categoryIds: [...next] });
    });

    pills.append(pill);
  }

  catsWrap.append(pills);
  root.append(statusWrap, limitWrap, catsWrap);
}

export function renderCountsByCategory({ events, categories }) {
  const root = document.getElementById("counts");
  root.innerHTML = "";

  if (!events.length) {
    root.append(el("div", null, "No events loaded."));
    return;
  }

  const counts = new Map();
  for (const ev of events) {
    const cat = ev?.categories?.[0]?.id;
    if (cat == null) continue;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  const catTitle = new Map(categories.map(c => [c.id, c.title ?? String(c.id)]));

  const rows = [...counts.entries()]
    .map(([id, n]) => ({ id, n, title: catTitle.get(id) ?? `Category ${id}` }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);

  const max = Math.max(...rows.map(r => r.n), 1);

  for (const r of rows) {
    const row = el("div", "count-row");
    const top = el("div", "count-row__top");
    top.append(el("div", null, r.title));
    top.append(el("div", null, String(r.n)));

    const bar = el("div", "bar");
    const fill = document.createElement("div");
    fill.style.width = `${Math.round((r.n / max) * 100)}%`;
    bar.append(fill);

    row.append(top, bar);
    root.append(row);
  }
}

export function renderEventCard({ event, onZoom }) {
  const root = document.getElementById("eventCard");
  root.classList.remove("muted");
  root.innerHTML = "";

  if (!event) {
    root.classList.add("muted");
    root.textContent = "Click an event on the map to see details here.";
    return;
  }

  const title = el("div", "event-title", event.title ?? "Untitled event");

  const tags = el("div", "tags");
  for (const c of event.categories ?? []) {
    tags.append(el("div", "tag", c.title ?? `Category ${c.id}`));
  }
  if (!(event.categories?.length)) tags.append(el("div", "tag", "Uncategorized"));

  const meta = el("div", "meta");
  const status = (event.status ?? "unknown").toUpperCase();
  const latestDate = getLatestGeometryDate(event);
  const latestStr = latestDate ? latestDate.toLocaleString() : "Unknown";

  meta.append(line("Status", status));
  meta.append(line("Latest geometry", latestStr));
  meta.append(line("Geometry points", String(event.geometry?.length ?? 0)));

  const actions = el("div", "actions");
  const zoomBtn = el("button", "btn", "Zoom to event");
  zoomBtn.addEventListener("click", () => onZoom?.(event));
  actions.append(zoomBtn);

  const links = el("div", "links");
  const sources = event.sources ?? [];
  if (sources.length) {
    for (const s of sources) {
      const a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = s.id ?? "source";
      links.append(a);
    }
  } else {
    links.append(el("div", "meta", "No sources listed."));
  }

  root.append(title, tags, meta, actions, links);
}

function line(label, value) {
  const d = document.createElement("div");
  d.innerHTML = `<b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`;
  return d;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}
