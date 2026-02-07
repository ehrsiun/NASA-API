# NASA EONET – Live Earth Events Map

This project is an interactive web map that visualizes recent natural events around the world, such as wildfires, storms, and volcanic activity. Users can explore events geographically and filter them by status, category, and quantity.

## API Usage
The application uses NASA’s EONET v3 (Earth Observatory Natural Event Tracker) API to fetch live event data. API requests are made from JavaScript using the browser `fetch()` function, with query parameters including `status` (open, closed, or all), `limit` (number of events returned), and `category` (comma-separated category IDs).

The API returns data in JSON format. Each event includes metadata and a list of GeoJSON-like geometries (Points or Polygons) representing event locations over time. This project uses the most recent geometry for each event to render it on an interactive map.

EONET does not require an API key or authentication, and no credentials are stored or exposed in this repository.

## Run Locally
```bash
npm install
npm run dev
