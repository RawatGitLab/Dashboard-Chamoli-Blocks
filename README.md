# 🏔️ Chamoli Block Dashboard

An interactive Web GIS dashboard for the **9 development blocks of Chamoli district, Uttarakhand**. It maps Census indicators by block on an OpenStreetMap basemap and lets you compare blocks through a choropleth map, a ranked chart, a block profile and a data table.

Built with **Vite**, **Leaflet** and **Chart.js**.

🌐 **Live demo:** _add your Vercel URL here_

---

## ✨ Features

- 🌍 **OpenStreetMap as the default basemap**, with CARTO Light, OpenTopoMap (terrain) and Esri World Imagery available from the layer control
- 🎯 **Map opens zoomed to Chamoli**, and a "Zoom to Chamoli" button resets the view at any time
- 🟩 **Choropleth map** with a five-class legend that updates for the selected indicator
- 🔀 **Nine switchable indicators** (see below)
- 📶 **Ranked bar chart** of all blocks for the selected indicator
- 🧾 **Block profile** with density, literacy, sex ratio, SC/ST population, gender split and worker breakdown
- 📋 **All-blocks table** with population, literacy and sex ratio
- 🔗 **Linked selection:** clicking a block on the map, in the chart or in the table selects it everywhere and zooms the map to it
- 📱 Responsive layout, with the map above the panel on small screens

## 📍 Blocks covered

Tharali, Gairsain, Narayan Bagar, Dewal, Karnaprayag, Ghat, Pokhari, Dasholi and Joshimath.

## 📊 Indicators

| Indicator | How it is calculated |
|---|---|
| Population | `TOT_P` |
| Population density (per km²) | `TOT_P / (Shape_Area / 1,000,000)` |
| Literacy rate | `P_LIT / (TOT_P - P_06) x 100` |
| Female literacy rate | `F_LIT / (TOT_F - F_06) x 100` |
| Sex ratio | `TOT_F / TOT_M x 1000` |
| Child sex ratio (age 0-6) | `F_06 / M_06 x 1000` |
| Scheduled Caste share | `P_SC / TOT_P x 100` |
| Scheduled Tribe share | `P_ST / TOT_P x 100` |
| Workers as share of population | `TOT_WORK_P / TOT_P x 100` |

Literacy rates use the population aged 7 and above (total population minus children aged 0-6), following the Census convention. Density assumes `Shape_Area` is in square metres.

## 🛠️ Tech stack

| Purpose | Library |
|---|---|
| Build tool and dev server | [Vite](https://vitejs.dev/) |
| Mapping | [Leaflet](https://leafletjs.com/) |
| Charts | [Chart.js](https://www.chartjs.org/) |
| Basemap tiles | OpenStreetMap, CARTO, OpenTopoMap, Esri |

## 🚀 Getting started

### 📋 Prerequisites

- Node.js 18 or later
- npm

### ▶️ Install and run

```bash
git clone https://github.com/RawatGitLab/Dashboard-Chamoli-Blocks.git
cd Dashboard-Chamoli-Blocks
npm install
npm run dev
```

Open the local URL printed in the terminal (usually `http://localhost:5173`).

### 📦 Build for production

```bash
npm run build
npm run preview
```

The production files are written to `dist/`.

## 🗂️ Project structure

```
chamoli-block-dashboard/
├── index.html              # Page layout (panel + map)
├── package.json
├── vite.config.js
├── .gitignore
└── src/
    ├── main.js             # Map, indicators, chart, table and profile logic
    ├── style.css           # Styles
    └── data/
        └── block-boundary.json   # Block boundaries and Census attributes (WGS84)
```

## 🗺️ Data

The block boundaries and Census attributes come from `Block-Boundary.geojson` for Chamoli district (9 features).

⚠️ **Coordinate system note:** the source file was labelled as CRS84 (longitude/latitude) but its coordinates were actually projected metres in **WGS 84 / UTM zone 44N (EPSG:32644)**. Leaflet expects longitude/latitude, so the coordinates were converted to WGS84 (EPSG:4326) before being saved as `src/data/block-boundary.json`. If you replace the data file, make sure the new file is in EPSG:4326, for example by exporting it that way from QGIS.

### 🔄 Updating the data

1. Export your boundary layer as GeoJSON in **EPSG:4326**.
2. Replace `src/data/block-boundary.json`.
3. Keep the attribute names used by the dashboard (`Name`, `TOT_P`, `TOT_M`, `TOT_F`, `P_LIT`, `P_06`, and so on), or update the formulas in `src/main.js`.

## ☁️ Deployment

### ▲ Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Use these settings (Vercel normally detects them automatically):

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

⚠️ Make sure `node_modules` is **not** committed. It is listed in `.gitignore`, and committing it from Windows causes a `Permission denied` error on `vite` during the Vercel build.

### 🌿 Netlify

Use build command `npm run build` and publish directory `dist`.

## 🎨 Customisation

- 🎨 **Colours:** edit the `RAMP` array in `src/main.js` for the map classes, and the CSS variables at the top of `src/style.css` for the interface.
- ➕ **Add an indicator:** add an entry to the `METRICS` object in `src/main.js` with a `label`, a `fmt` function and a `get` function. It appears in the dropdown automatically.
- ⭐ **Default indicator:** change `metricKey` in `src/main.js`.

## 🙏 Attribution

- Map data &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Census attributes and administrative boundaries as supplied in the source dataset

## 👤 Author

Built by **RawatGitLab** as part of the Web GIS district portal work for Uttarakhand.
