# Chamoli Block Dashboard

Vite + Leaflet + Chart.js dashboard built from `Block-Boundary.geojson` (9 Chamoli blocks, Census attributes).

- Default basemap: OpenStreetMap (switch to CARTO Light, OpenTopoMap or Esri imagery from the layer control)
- Map opens zoomed to the Chamoli district extent; "Zoom to Chamoli" button resets the view
- Choropleth by 9 indicators, ranked bar chart, block profile, clickable table

## Run
npm install
npm run dev

## Build
npm run build   # output in dist/
