import L from "leaflet";

// Fix Leaflet marker icon paths for Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

function isValidLatLng(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat <= 90 && lat >= -90 && lng <= 180 && lng >= -180;
}

export function getLatestGeometry(event) {
  const g = event?.geometry;
  if (!Array.isArray(g) || g.length === 0) return null;

  const sorted = [...g].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted[sorted.length - 1] ?? null;
}

export function getLatestGeometryDate(event) {
  const lg = getLatestGeometry(event);
  if (!lg?.date) return null;
  const d = new Date(lg.date);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeCategoryTitle(event) {
  const cats = event?.categories ?? [];
  if (!cats.length) return "Uncategorized";
  return cats[0]?.title ?? "Uncategorized";
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function makeTooltipHtml(event) {
  const title = event?.title ?? "Untitled event";
  const cat = normalizeCategoryTitle(event);
  const dt = getLatestGeometryDate(event);
  const dateStr = dt ? dt.toLocaleString() : "Unknown date";
  return `<div style="display:flex;flex-direction:column;gap:4px;">
    <div style="font-weight:650;line-height:1.15;">${escapeHtml(title)}</div>
    <div style="font-size:12px;opacity:0.82;">${escapeHtml(cat)} • ${escapeHtml(dateStr)}</div>
  </div>`;
}

export function initMap(containerId = "map") {
  const map = L.map(containerId, {
    zoomControl: true,
    worldCopyJump: true
  }).setView([20, 0], 2);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
  }).addTo(map);

  const layerGroup = L.layerGroup().addTo(map);

  return {
    map,
    layerGroup,
    layerIndex: new Map()
  };
}

export function clearMapLayers(state) {
  state.layerGroup.clearLayers();
  state.layerIndex.clear();
}

function styleForPolygon() {
  return {
    color: "rgba(255,255,255,0.65)",
    weight: 2,
    fillColor: "rgba(255,255,255,0.20)",
    fillOpacity: 0.25
  };
}

function styleForPolygonHover() {
  return {
    color: "rgba(255,255,255,0.90)",
    weight: 3,
    fillOpacity: 0.35
  };
}

export function renderEventsOnMap(state, events, { onSelect } = {}) {
  clearMapLayers(state);

  for (const ev of events) {
    const id = ev?.id;
    const latest = getLatestGeometry(ev);
    if (!id || !latest || !latest?.coordinates) continue;

    const type = latest?.type;
    const coords = latest.coordinates;

    let layer = null;

    if (type === "Point" && Array.isArray(coords) && coords.length >= 2) {
      const [lng, lat] = coords;
      if (!isValidLatLng(lat, lng)) continue;

      layer = L.circleMarker([lat, lng], {
        radius: 7,
        weight: 2,
        color: "rgba(255,255,255,0.70)",
        fillColor: "rgba(255,255,255,0.35)",
        fillOpacity: 0.55
      });

      layer.on("mouseover", () => layer.setStyle({ radius: 9, color: "rgba(255,255,255,0.95)", fillOpacity: 0.75 }));
      layer.on("mouseout", () => layer.setStyle({ radius: 7, color: "rgba(255,255,255,0.70)", fillOpacity: 0.55 }));
    }

    if (type === "Polygon" && Array.isArray(coords)) {
      const rings = coords
        .map((ring) => Array.isArray(ring) ? ring.map(([lng, lat]) => [lat, lng]) : null)
        .filter(Boolean);

      if (!rings.length) continue;

      layer = L.polygon(rings, styleForPolygon());
      layer.on("mouseover", () => layer.setStyle(styleForPolygonHover()));
      layer.on("mouseout", () => layer.setStyle(styleForPolygon()));
    }

    if (!layer) continue;

    layer.bindTooltip(makeTooltipHtml(ev), {
      sticky: true,
      direction: "top",
      opacity: 1
    });

    layer.on("click", () => onSelect?.(ev));

    layer.addTo(state.layerGroup);
    state.layerIndex.set(id, layer);
  }
}

export function zoomToEvent(state, event) {
  const id = event?.id;
  if (!id) return;

  const layer = state.layerIndex.get(id);
  if (!layer) return;

  if (typeof layer.getBounds === "function") {
    state.map.fitBounds(layer.getBounds(), { padding: [30, 30], maxZoom: 7 });
    return;
  }
  if (typeof layer.getLatLng === "function") {
    const ll = layer.getLatLng();
    state.map.setView(ll, Math.max(state.map.getZoom(), 6), { animate: true });
  }
}

export function flashEvent(state, event) {
  const id = event?.id;
  const layer = id ? state.layerIndex.get(id) : null;
  if (!layer) return;

  if (layer.setStyle) {
    layer.setStyle({ color: "rgba(255,255,255,0.95)" });
    setTimeout(() => {
      if (layer instanceof L.Polygon) layer.setStyle(styleForPolygon());
      if (layer instanceof L.CircleMarker) layer.setStyle({ color: "rgba(255,255,255,0.70)" });
    }, 550);
  }
}
