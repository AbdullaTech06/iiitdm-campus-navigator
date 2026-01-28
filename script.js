// ================= SUPABASE =================
const supabaseUrl = "https://iistugxdqonjsrxuvpgs.supabase.co";
const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ================= MAP =================
const map = L.map("map", {
  center: [15.759267, 78.037734],
  zoom: 17,
  minZoom: 15,
  maxZoom: 19
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// ================= GLOBALS =================
let locations = [];
let markers = [];
let userMarker = null;
let watchId = null;
let routingControl = null;
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

  locations.forEach(loc => {
    const m = L.circleMarker([loc.Lat, loc.Lng], {
      radius: 7,
      color: "#dc2626",
      fillColor: "#dc2626",
      fillOpacity: 0.9
    }).addTo(map);

    m.bindPopup(`
      <b>${loc.Name}</b><br>
      ${loc.Category}<br>
      ${loc.Description}<br><br>
      <button onclick="navigateTo(${loc.Lat}, ${loc.Lng})">
        Show Route
      </button>
    `);

    markers.push(m);
  });
}

// ================= SEARCH =================
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  searchResults.innerHTML = "";
  if (!q) return;

  locations.filter(l =>
    l.Name.toLowerCase().includes(q)
  ).forEach(l => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = l.Name;
    div.onclick = () => {
      map.flyTo([l.Lat, l.Lng], 18);
      searchResults.innerHTML = "";
    };
    searchResults.appendChild(div);
  });
});

// ================= LIVE LOCATION =================
document.getElementById("liveBtn").onclick = () => {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(pos => {
    const latlng = [pos.coords.latitude, pos.coords.longitude];

    if (!userMarker) {
      userMarker = L.circleMarker(latlng, {
        radius: 8,
        color: "#7f1d1d",
        fillColor: "#ef4444",
        fillOpacity: 1
      }).addTo(map);
    } else {
      userMarker.setLatLng(latlng);
    }

    if (destination) updateRoute(latlng, destination);
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
  updateRoute(userMarker.getLatLng(), destination);
};

function updateRoute(start, end) {
  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: [start, end],
    lineOptions: {
      styles: [{ color: "#dc2626", weight: 5 }]
    },
    addWaypoints: false,
    draggableWaypoints: false,
    show: false
  }).addTo(map);
}

document.getElementById("cancelRouteBtn").onclick = () => {
  if (routingControl) map.removeControl(routingControl);
  routingControl = null;
  destination = null;
};

// ================= INIT =================
loadLocations();
