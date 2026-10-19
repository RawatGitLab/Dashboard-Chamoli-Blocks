import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';
import './style.css';
import blocks from './data/block-boundary.json';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

/* ---------- helpers ---------- */
const nf = (v, d = 0) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
const pct = (a, b) => (b ? (a / b) * 100 : 0);

/* ---------- indicators ---------- */
const METRICS = {
  pop: { label: 'Population', fmt: (v) => nf(v), get: (p) => p.TOT_P },
  density: {
    label: 'Population density (per km²)',
    fmt: (v) => nf(v, 1),
    get: (p) => p.TOT_P / (p.Shape_Area / 1e6),
  },
  literacy: {
    label: 'Literacy rate',
    fmt: (v) => nf(v, 1) + '%',
    get: (p) => pct(p.P_LIT, p.TOT_P - p.P_06),
  },
  femLiteracy: {
    label: 'Female literacy rate',
    fmt: (v) => nf(v, 1) + '%',
    get: (p) => pct(p.F_LIT, p.TOT_F - p.F_06),
  },
  sexRatio: {
    label: 'Sex ratio (females per 1,000 males)',
    fmt: (v) => nf(v),
    get: (p) => (p.TOT_F / p.TOT_M) * 1000,
  },
  childSexRatio: {
    label: 'Child sex ratio, age 0–6',
    fmt: (v) => nf(v),
    get: (p) => (p.F_06 / p.M_06) * 1000,
  },
  sc: { label: 'Scheduled Caste share', fmt: (v) => nf(v, 1) + '%', get: (p) => pct(p.P_SC, p.TOT_P) },
  st: { label: 'Scheduled Tribe share', fmt: (v) => nf(v, 1) + '%', get: (p) => pct(p.P_ST, p.TOT_P) },
  workers: {
    label: 'Workers as share of population',
    fmt: (v) => nf(v, 1) + '%',
    get: (p) => pct(p.TOT_WORK_P, p.TOT_P),
  },
};

const RAMP = ['#e4efeb', '#b7d7ce', '#80b8aa', '#3f8b7d', '#1b5047'];
const SELECT_COLOR = '#d99a1e';
const INK = '#14231f';

/* ---------- state ---------- */
const features = blocks.features;
const names = features.map((f) => f.properties.Name);
let metricKey = 'literacy';
let selected = null;
let breaks = [];
const layers = {};

/* ---------- district totals ---------- */
const sum = (k) => features.reduce((s, f) => s + f.properties[k], 0);
const total = {
  TOT_P: sum('TOT_P'),
  TOT_M: sum('TOT_M'),
  TOT_F: sum('TOT_F'),
  No_HH: sum('No_HH'),
  P_LIT: sum('P_LIT'),
  P_06: sum('P_06'),
};

document.getElementById('kpis').innerHTML = `
  <div class="kpi"><span class="kpi-v">${nf(total.TOT_P)}</span><span class="kpi-l">Population</span></div>
  <div class="kpi"><span class="kpi-v">${nf(total.No_HH)}</span><span class="kpi-l">Households</span></div>
  <div class="kpi"><span class="kpi-v">${nf(pct(total.P_LIT, total.TOT_P - total.P_06), 1)}%</span><span class="kpi-l">Literacy rate</span></div>
  <div class="kpi"><span class="kpi-v">${nf((total.TOT_F / total.TOT_M) * 1000)}</span><span class="kpi-l">Females per 1,000 males</span></div>
`;

/* ---------- map ---------- */
const map = L.map('map', { zoomControl: true, minZoom: 7, zoomSnap: 0.25 });

const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});
const light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
});
const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  subdomains: 'abc',
  attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Style &copy; OpenTopoMap',
});
const imagery = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
);

// OpenStreetMap is the default basemap
osm.addTo(map);

function colourFor(value) {
  let i = 0;
  while (i < breaks.length - 2 && value > breaks[i + 1]) i++;
  return RAMP[i];
}

function computeBreaks() {
  const vals = features.map((f) => METRICS[metricKey].get(f.properties));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const step = (max - min) / RAMP.length || 1;
  breaks = Array.from({ length: RAMP.length + 1 }, (_, i) => min + step * i);
}

function baseStyle(feature) {
  const v = METRICS[metricKey].get(feature.properties);
  const isSel = feature.properties.Name === selected;
  return {
    fillColor: colourFor(v),
    fillOpacity: 0.82,
    color: isSel ? SELECT_COLOR : '#ffffff',
    weight: isSel ? 3.5 : 1.5,
    opacity: 1,
  };
}

const geo = L.geoJSON(blocks, {
  style: baseStyle,
  onEachFeature: (feature, layer) => {
    const name = feature.properties.Name;
    layers[name] = layer;
    layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'block-label' });
    layer.on({
      mouseover: () => {
        if (name !== selected) layer.setStyle({ weight: 3, color: INK });
        layer.bringToFront();
        if (selected && layers[selected]) layers[selected].bringToFront();
      },
      mouseout: () => layer.setStyle(baseStyle(feature)),
      click: () => select(name),
    });
  },
}).addTo(map);

// Zoom to Chamoli
const chamoliBounds = geo.getBounds();
function zoomToChamoli() {
  map.fitBounds(chamoliBounds, { padding: [24, 24] });
}
zoomToChamoli();

L.control
  .layers(
    { OpenStreetMap: osm, 'Light (CARTO)': light, 'Terrain (OpenTopoMap)': topo, 'Satellite (Esri)': imagery },
    { 'Block boundaries': geo },
    { position: 'topright' }
  )
  .addTo(map);

const ResetControl = L.Control.extend({
  options: { position: 'topleft' },
  onAdd() {
    const btn = L.DomUtil.create('button', 'reset-btn');
    btn.type = 'button';
    btn.textContent = 'Zoom to Chamoli';
    L.DomEvent.disableClickPropagation(btn);
    btn.addEventListener('click', () => {
      select(null);
      zoomToChamoli();
    });
    return btn;
  },
});
new ResetControl().addTo(map);

/* ---------- legend ---------- */
function renderLegend() {
  const m = METRICS[metricKey];
  const rows = RAMP.map(
    (c, i) =>
      `<li><i style="background:${c}"></i>${m.fmt(breaks[i])} to ${m.fmt(breaks[i + 1])}</li>`
  ).join('');
  document.getElementById('legend').innerHTML = `<strong>${m.label}</strong><ul>${rows}</ul>`;
}

/* ---------- chart ---------- */
const chart = new Chart(document.getElementById('chart'), {
  type: 'bar',
  data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderRadius: 3 }] },
  options: {
    indexAxis: 'y',
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => METRICS[metricKey].fmt(c.parsed.x) } },
    },
    scales: {
      x: { grid: { color: '#e3e9e7' }, ticks: { color: '#5b6b66', font: { family: 'Figtree' } } },
      y: { grid: { display: false }, ticks: { color: INK, font: { family: 'Figtree', size: 12 } } },
    },
    onClick: (_, els) => {
      if (els.length) select(chart.data.labels[els[0].index]);
    },
    onHover: (e, els) => {
      e.native.target.style.cursor = els.length ? 'pointer' : 'default';
    },
  },
});

function renderChart() {
  const m = METRICS[metricKey];
  const rows = features
    .map((f) => ({ name: f.properties.Name, v: m.get(f.properties) }))
    .sort((a, b) => b.v - a.v);
  chart.data.labels = rows.map((r) => r.name);
  chart.data.datasets[0].data = rows.map((r) => r.v);
  chart.data.datasets[0].backgroundColor = rows.map((r) =>
    r.name === selected ? SELECT_COLOR : colourFor(r.v)
  );
  chart.data.datasets[0].borderColor = rows.map((r) => (r.name === selected ? SELECT_COLOR : '#7fa89f'));
  chart.data.datasets[0].borderWidth = 1;
  chart.update();
}

/* ---------- table ---------- */
function renderTable() {
  const tbody = document.querySelector('#table tbody');
  const rows = [...features].sort((a, b) => b.properties.TOT_P - a.properties.TOT_P);
  tbody.innerHTML = rows
    .map((f) => {
      const p = f.properties;
      return `<tr data-name="${p.Name}" class="${p.Name === selected ? 'on' : ''}" tabindex="0">
        <td>${p.Name}</td>
        <td class="num">${nf(p.TOT_P)}</td>
        <td class="num">${nf(METRICS.literacy.get(p), 1)}%</td>
        <td class="num">${nf(METRICS.sexRatio.get(p))}</td></tr>`;
    })
    .join('');
}
document.querySelector('#table tbody').addEventListener('click', (e) => {
  const tr = e.target.closest('tr');
  if (tr) select(tr.dataset.name);
});
document.querySelector('#table tbody').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const tr = e.target.closest('tr');
    if (tr) select(tr.dataset.name);
  }
});

/* ---------- profile ---------- */
function split(label, m, f) {
  const t = m + f || 1;
  return `<div class="split">
    <div class="split-top"><span>${label}</span><span>${nf(m + f)}</span></div>
    <div class="bar"><b style="width:${(m / t) * 100}%"></b></div>
    <div class="split-bot"><span>Male ${nf(m)}</span><span>Female ${nf(f)}</span></div>
  </div>`;
}

function renderProfile() {
  const el = document.getElementById('profile');
  if (!selected) {
    el.innerHTML = `<h2>Block profile</h2><p class="hint">Select a block on the map, the chart or the table to see its detail.</p>`;
    return;
  }
  const p = features.find((f) => f.properties.Name === selected).properties;
  el.innerHTML = `
    <h2>${p.Name}</h2>
    <p class="hint">Block code ${p.Block_Code}, ${nf(p.Shape_Area / 1e6, 1)} km², ${nf(p.No_HH)} households</p>
    <dl class="facts">
      <div><dt>Population density</dt><dd>${nf(METRICS.density.get(p), 1)} per km²</dd></div>
      <div><dt>Literacy rate</dt><dd>${nf(METRICS.literacy.get(p), 1)}%</dd></div>
      <div><dt>Female literacy</dt><dd>${nf(METRICS.femLiteracy.get(p), 1)}%</dd></div>
      <div><dt>Sex ratio</dt><dd>${nf(METRICS.sexRatio.get(p))}</dd></div>
      <div><dt>Child sex ratio</dt><dd>${nf(METRICS.childSexRatio.get(p))}</dd></div>
      <div><dt>Scheduled Caste</dt><dd>${nf(p.P_SC)} (${nf(METRICS.sc.get(p), 1)}%)</dd></div>
      <div><dt>Scheduled Tribe</dt><dd>${nf(p.P_ST)} (${nf(METRICS.st.get(p), 1)}%)</dd></div>
      <div><dt>Children age 0–6</dt><dd>${nf(p.P_06)}</dd></div>
    </dl>
    ${split('Population', p.TOT_M, p.TOT_F)}
    ${split('Literate people', p.M_LIT, p.F_LIT)}
    ${split('Workers', p.TOT_WORK_M, p.TOT_WORK_F)}
    <div class="work">
      <div><span>Main workers</span><strong>${nf(p.MAINWORK_P)}</strong></div>
      <div><span>Marginal workers</span><strong>${nf(p.MARGWORK_P)}</strong></div>
      <div><span>Non-workers</span><strong>${nf(p.NON_WORK_P)}</strong></div>
    </div>`;
}

/* ---------- orchestration ---------- */
function refresh() {
  computeBreaks();
  geo.setStyle(baseStyle);
  if (selected && layers[selected]) layers[selected].bringToFront();
  renderLegend();
  renderChart();
  renderTable();
  renderProfile();
}

function select(name) {
  selected = name === selected ? null : name;
  refresh();
  if (selected) map.flyToBounds(layers[selected].getBounds(), { padding: [40, 40], duration: 0.6, maxZoom: 11 });
  const row = document.querySelector('#table tr.on');
  if (row) row.scrollIntoView({ block: 'nearest' });
}

const metricSel = document.getElementById('metric');
metricSel.innerHTML = Object.entries(METRICS)
  .map(([k, m]) => `<option value="${k}" ${k === metricKey ? 'selected' : ''}>${m.label}</option>`)
  .join('');
metricSel.addEventListener('change', () => {
  metricKey = metricSel.value;
  refresh();
});

refresh();
