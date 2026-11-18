# WEATHERLY PRO

A professional weather platform built with **React + Vite**, **Tailwind CSS**, **Recharts**, **Leaflet / OpenStreetMap** and **Lucide** icons. All weather values come from real data providers. Nothing is simulated.

> Upgraded from the original *Weatherly* vanilla HTML/CSS/JS dashboard. The original files are kept unchanged in [`legacy/`](legacy/), and all of their features (city search, the 7 Kyrgyz region selector, current weather, multi-day forecast, Open-Meteo data) exist in the new app.

## Features

| Page | What it does |
|---|---|
| **Dashboard** | Current temperature, feels-like, conditions, location, icon, humidity, wind speed/direction/gusts, pressure, visibility, UV index, sunrise/sunset arc, cloud cover, AQI, 24 h strip and chart, chance-of-rain chart, 7-day cards, Kyrgyz cities, region quick-select |
| **Forecast** | Interactive 24-hour forecast (temperature, icons, rain probability, wind) with charts. 7-day forecast with min/max range bars; each day expands into full details and an hourly chart |
| **Kyrgyzstan map** | Real boundaries of all 7 oblasts, coloured by live temperature. Click a region or city pin to see its live weather. Cities: Bishkek, Osh, Karakol, Naryn, Talas, Tokmok, Jalal-Abad, Batken, Isfana (Razzakov) |
| **Radar** | Animated RainViewer precipitation radar with a snow colour option, live cloud-cover and wind-arrow grids from Open-Meteo, optional OpenWeatherMap tile layers, zoom/locate/recenter controls |
| **Air quality** | US & EU AQI gauge, PM2.5, PM10, CO, NO₂, SO₂, O₃ with WHO guideline bars, main pollutant, 24 h AQI trend and health advice for the measured level |
| **Analytics** | 7/30/90-day history (ERA5 archive): temperature, precipitation, wind and humidity charts, KPIs, week-over-week temperature change |
| **AI assistant** | Claude answers weather questions using the live data as context. Without a key it shows a configuration message |
| **Favorites** | Save and remove cities (localStorage), live weather per city, compare 2–4 cities in a table and chart |
| **Settings** | Dark/Light/System theme, °C/°F, wind (km/h, m/s, mph, knots), pressure (hPa/mmHg), language, automatic geolocation, alerts, animated background. All saved automatically |

Also included: the whole UI in Kyrgyz, Russian and English; worldwide city search with autocomplete; weather alerts (heavy rain, snow, strong wind, extreme heat/cold, storms) derived from forecast thresholds; animated backgrounds that follow the current weather; loading skeletons; error/empty/offline states; a responsive sidebar, mobile bottom navigation and drawer.

## Getting started

```bash
npm install
cp .env.example .env      # optional – only needed for the AI assistant / OWM layers
npm run dev               # http://localhost:5173
```

Other scripts:

```bash
npm run build        # production build to dist/
npm run preview      # serve the build (includes the /api middleware)
npm run check:i18n   # verify every translation key exists in ky/ru/en
```

## API keys

| Variable | Required? | Used for |
|---|---|---|
| `ANTHROPIC_API_KEY` | Optional | AI weather assistant (Claude, default model `claude-opus-5-5`; override with `ANTHROPIC_MODEL`) |
| `OPENWEATHER_API_KEY` | Optional | Extra OpenWeatherMap cloud / wind / temperature tile layers on the radar page |

Everything else needs **no key**: Open-Meteo (forecast, air quality, archive, geocoding), RainViewer (radar), OpenStreetMap (basemap), BigDataCloud (reverse geocoding for "use my location").

**Keys never reach the browser.** The variables have no `VITE_` prefix, so Vite never bundles them. They are read only by [`server/apiMiddleware.js`](server/apiMiddleware.js), which runs inside the Vite dev/preview server and exposes:

- `GET /api/config`: which optional features are configured (booleans only)
- `POST /api/assistant`: proxies the question and weather context to Claude
- `GET /api/tiles/owm/:layer/:z/:x/:y.png`: OpenWeatherMap tile proxy

For a static production host, deploy `createApiHandler` from that file as a serverless function or a small Node server on the same origin.

## Project structure

```
server/apiMiddleware.js      server-side API (keys stay here)
public/data/kg-regions.geojson   Kyrgyzstan oblast boundaries (geoBoundaries, CC BY 4.0)
src/
  services/api.js            centralised API client (cache + request de-duplication)
  context/                   settings + i18n, location, favorites, weather data, toasts
  hooks/                     useAsync, useFormat (units/locale), useKgWeather, useFavoritesWeather
  lib/                       units, time, weather codes, AQI, alerts, forecast helpers
  i18n/translations.js       ky / ru / en dictionaries
  components/layout/         sidebar, sticky header, mobile nav
  components/weather/        cards, search, icons, animated background…
  components/charts/         Recharts components + theme
  components/map/            Leaflet base map + controls
  pages/                     one file per route
legacy/                      the original HTML/CSS/JS version
```

## Data sources

Open-Meteo (CC BY 4.0) · CAMS air quality · ERA5 reanalysis · RainViewer · © OpenStreetMap contributors · geoBoundaries · BigDataCloud · Anthropic Claude
