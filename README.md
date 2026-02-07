# NASA EONET – Live Earth Events Map

A lightweight, interactive web map that visualizes natural events from NASA’s **EONET v3** API (wildfires, storms, volcanoes, etc.). The app fetches event data as **JSON**, where each event includes **GeoJSON-like geometry** (Points and sometimes Polygons). Users can filter by event **status** (open/closed/all), **limit**, and **categories**, then explore events via hover tooltips and a click-to-view editorial sidebar.

## API Used
- Categories: `https://eonet.gsfc.nasa.gov/api/v3/categories`
- Events: `https://eonet.gsfc.nasa.gov/api/v3/events?status=...&limit=...&category=...`
Responses are JSON, and event geometries follow a GeoJSON-like format (e.g., `type: "Point"` with `[lon, lat]` coordinates or `type: "Polygon"` with coordinate rings).

## Features
- Map visualization (Leaflet): Points + Polygons
- Hover highlight + tooltip (title, category, latest date)
- Click event → sidebar details + “Zoom to event”
- Filters: status, limit, multi-select categories
- Mini data-vis: counts by category for the currently loaded results
- Loading/error banner

## Run Locally
```bash
npm install
npm run dev
```

## Build / Preview
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages (gh-pages)
1) In `vite.config.js`, set:
```js
base: "/YOUR_REPO_NAME/"
```

2) Commit and push your repo to GitHub.

3) Deploy:
```bash
npm run deploy
```

4) In GitHub:
- Repo → **Settings** → **Pages**
- Source: **Deploy from a branch**
- Branch: `gh-pages` / root

Your site will publish at:
`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Demo Video Checklist (30–60s)
- Load page (map + events appear)
- Change Status (open → all) and show results update
- Toggle 1–2 category pills
- Hover an event to show tooltip
- Click an event → sidebar updates
- Click “Zoom to event”
