// ================= SUPABASE =================
const supabase = window.supabase.createClient(
  "https://iistugxdqonjsrxuvpgs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4"
);

// ================= MAP =================
const map = L.map("map").setView([15.759267, 78.037734], 17);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// ================= STATE =================
let locations = [];
let markers = [];
let userMarker = null;
let watchId = null;
let routing = null;
let destination = null;

// ================= LOAD LOCATIONS =================
async function loadLocations() {
  const { data, error } = await supabase.from("Location").select("*");

  if (error) {
    console.error(error);
    return;
  }

  locations = data;
  addMarkers();
}

function addMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  locations.forEach(l => {
    const m = L.marker([l.Lat, l.Lng]).addTo(map);

    m.bindPopup(`
      <b>${l.Name}</b><br/>
      ${l.Category}<br/>
      ${l.Description}<br/><br/>
      <button onclick="navigateTo(${l.Lat}, ${l.Lng})">Show Route</button>
    `);

    markers.push(m);
  });
}

// ================= SEARCH =================
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

searchInput.oninput = () => {
  searchResults.innerHTML = "";
  const q = searchInput.value.toLowerCase();
  if (!q) return;

  locations.filter(l =>
    l.Name.toLowerCase().includes(q) ||
    l.Category.toLowerCase().includes(q)
  ).forEach(l => {
    const d = document.createElement("div");
    d.className = "result-item";
    d.textContent = l.Name;
    d.onclick = () => map.flyTo([l.Lat, l.Lng], 18);
    searchResults.appendChild(d);
  });
};

// ================= LIVE LOCATION =================
document.getElementById("liveBtn").onclick = () => {
  watchId = navigator.geolocation.watchPosition(pos => {
    const p = [pos.coords.latitude, pos.coords.longitude];

    if (!userMarker) {
      userMarker = L.circleMarker(p, { radius: 8, color: "red" }).addTo(map);
    } else {
      userMarker.setLatLng(p);
    }

    if (destination) drawRoute(p, destination);
  });
};

document.getElementById("stopLiveBtn").onclick = () => {
  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = null;

  if (userMarker) map.removeLayer(userMarker);
  userMarker = null;
};

// ================= ROUTING =================
window.navigateTo = (lat, lng) => {
  if (!userMarker) {
    alert("Enable live location first");
    return;
  }
  destination = [lat, lng];
  drawRoute(userMarker.getLatLng(), destination);
};

function drawRoute(start, end) {
  if (routing) map.removeControl(routing);

  routing = L.Routing.control({
    waypoints: [start, end],
    addWaypoints: false,
    draggableWaypoints: false,
    show: false
  }).addTo(map);
}

document.getElementById("cancelRouteBtn").onclick = () => {
  if (routing) map.removeControl(routing);
  routing = null;
  destination = null;
};

// ================= INIT =================
loadLocations();
