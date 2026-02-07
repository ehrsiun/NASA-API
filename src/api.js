const BASE = "https://eonet.gsfc.nasa.gov/api/v3";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function fetchCategories() {
  const data = await fetchJson(`${BASE}/categories`);
  return data.categories ?? [];
}

export async function fetchEvents({ status = "open", limit = 50, categoryIds = [] } = {}) {
  const params = new URLSearchParams();

  if (status === "all") params.set("status", "all");
  else if (status) params.set("status", status);

  params.set("limit", String(limit));

  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    params.set("category", categoryIds.join(","));
  }

  const url = `${BASE}/events?${params.toString()}`;
  const data = await fetchJson(url);
  return data.events ?? [];
}
