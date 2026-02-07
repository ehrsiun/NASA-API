import "leaflet/dist/leaflet.css";
import "./styles.css";

import { fetchCategories, fetchEvents } from "./api.js";
import { initMap, renderEventsOnMap, zoomToEvent, flashEvent } from "./map.js";
import { debounce, renderControls, renderCountsByCategory, renderEventCard, setStatusBanner } from "./ui.js";

const appState = {
  status: "open",
  limit: 50,
  categoryIds: [],
  categories: [],
  events: [],
  selectedEvent: null
};

const mapState = initMap("map");

const applyFilters = debounce(async (partialUpdate = {}) => {
  Object.assign(appState, partialUpdate);

  setStatusBanner({ show: true, text: "Loading events…" });

  try {
    const events = await fetchEvents({
      status: appState.status,
      limit: appState.limit,
      categoryIds: appState.categoryIds
    });

    appState.events = events;

    renderEventsOnMap(mapState, events, {
      onSelect: (ev) => {
        appState.selectedEvent = ev;
        renderEventCard({
          event: ev,
          onZoom: (e) => {
            zoomToEvent(mapState, e);
            flashEvent(mapState, e);
          }
        });
      }
    });

    if (appState.selectedEvent) {
      const stillThere = events.some(e => e.id === appState.selectedEvent.id);
      if (!stillThere) {
        appState.selectedEvent = null;
        renderEventCard({ event: null });
      }
    }

    renderCountsByCategory({ events, categories: appState.categories });

    setStatusBanner({ show: false, text: "" });
  } catch (err) {
    console.error(err);
    setStatusBanner({ show: true, text: `Error loading data: ${err.message}` });
  }
}, 220);

async function init() {
  setStatusBanner({ show: true, text: "Loading categories…" });

  try {
    const categories = await fetchCategories();
    appState.categories = categories;

    const onChange = (update) => {
      Object.assign(appState, update);
      renderControls({ categories, state: appState, onChange });
      applyFilters(update);
    };

    renderControls({ categories, state: appState, onChange });

    await applyFilters({});
  } catch (err) {
    console.error(err);
    setStatusBanner({ show: true, text: `Error: ${err.message}` });
  }
}

init();
