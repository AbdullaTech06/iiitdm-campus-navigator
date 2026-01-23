// ===== MAP SETUP =====
const campusCenter = [15.758844, 78.037691];
const map = L.map("map", {
  center: campusCenter,
  zoom: 18,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
}).addTo(map);

// ===== LIVE LOCATION =====
let userLocation = null;
let watchId = null;
let routeLine = null;

const LocateControl = L.Control.extend({
  onAdd() {
    const btn = L.DomUtil.create("div", "leaflet-control-locate");
    btn.innerHTML = "📍";

    btn.onclick = () => {
      if (watchId) stopLocation(btn);
      else startLocation(btn);
    };

    return btn;
  }
});

map.addControl(new LocateControl({ position: "topright" }));

function startLocation(btn) {
  btn.classList.add("active");

  watchId = navigator.geolocation.watchPosition(pos => {
    userLocation = [pos.coords.latitude, pos.coords.longitude];

    if (window.userMarker) map.removeLayer(window.userMarker);
    window.userMarker = L.circleMarker(userLocation, {
      radius: 7,
      fillColor: "#2563eb",
      color: "#fff",
      weight: 2,
      fillOpacity: 1
    }).addTo(map);
  });
}

function stopLocation(btn) {
  navigator.geolocation.clearWatch(watchId);
  watchId = null;
  btn.classList.remove("active");
}

// ===== ROUTING =====
function drawRoute(toLatLng) {
  if (!userLocation) {
    alert("Enable live location first");
    return;
  }

  clearRoute();

  routeLine = L.polyline([userLocation, toLatLng], {
    color: "#dc2626",
    weight: 4
  }).addTo(map);

  map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
}

function clearRoute() {
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
}

document.getElementById("clearRouteBtn").onclick = clearRoute;

// ===== FOOD COURT BUILDING =====
const foodCourtCoords = [
  [15.759034, 78.037565],
  [15.759212, 78.037613],
  [15.759261, 78.037474],
  [15.759137, 78.037434],
];

const foodCourtCenter = [
  (15.759034 + 15.759212 + 15.759261 + 15.759137) / 4,
  (78.037565 + 78.037613 + 78.037474 + 78.037434) / 4
];

// Polygon
const foodCourt = L.polygon(foodCourtCoords, {
  color: "#b45309",
  fillColor: "#f59e0b",
  fillOpacity: 0.6,
  weight: 2
}).addTo(map);

foodCourt.bindPopup(`
  <b>🍽️ Food Court</b><br/>
  Campus dining area<br/><br/>
  <button onclick="drawRoute([${foodCourtCenter[0]}, ${foodCourtCenter[1]}])">
    Navigate
  </button>
`);

// Label on building
L.marker(foodCourtCenter, {
  icon: L.divIcon({
    className: "building-label",
    html: "Food Court",
    iconSize: [100, 20],
    iconAnchor: [50, 10]
  })
}).addTo(map);

// Hover effect
foodCourt.on("mouseover", () =>
  foodCourt.setStyle({ fillOpacity: 0.85 })
);
foodCourt.on("mouseout", () =>
  foodCourt.setStyle({ fillOpacity: 0.6 })
);
