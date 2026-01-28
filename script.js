// Supabase
const supabase = window.supabase.createClient(
  "https://iistugxdqonjsrxuvpgs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4"
);

// Map (zoom restricted)
const map = L.map("map", {
  minZoom: 15,
  maxZoom: 19
}).setView([0, 0], 17);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// Icons
const locationIcon = L.icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const liveIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;
    height:16px;
    background:red;
    border:4px solid rgba(255,0,0,0.3);
    border-radius:50%;
  "></div>`
});

let markers = [];
let routeControl = null;
let liveMarker = null;
let watchId = null;
let allLocations = [];
let activeCategory = null;

// Load locations
async function loadLocations() {
  const { data, error } = await supabase.from("Location").select("*");
  if (error) return console.error(error);

  allLocations = data;
  drawMarkers(data);
  createCategoryChips(data);

  if (data.length) {
    map.setView([data[0].Lat, data[0].Lng], 17);
  }
}

function drawMarkers(data) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(loc => {
    if (activeCategory && loc.Category !== activeCategory) return;

    const m = L.marker([loc.Lat, loc.Lng], { icon: locationIcon })
      .addTo(map)
      .bindPopup(
        `<b>${loc.Name}</b><br>${loc.Description}`
      )
      .on("click", () => {
        if (liveMarker) {
          showRoute(liveMarker.getLatLng(), [loc.Lat, loc.Lng]);
        }
      });

    markers.push(m);
  });
}

// Category chips
function createCategoryChips(data) {
  const container = document.getElementById("categoryChips");
  container.innerHTML = "";

  [...new Set(data.map(d => d.Category))].forEach(cat => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = cat;
    chip.onclick = () => {
      activeCategory = activeCategory === cat ? null : cat;
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      if (activeCategory) chip.classList.add("active");
      drawMarkers(allLocations);
    };
    container.appendChild(chip);
  });
}

// Search
document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  drawMarkers(allLocations.filter(l => l.Name.toLowerCase().includes(q)));
});

// Live location (optimized)
function showLive() {
  if (watchId) return;

  watchId = navigator.geolocation.watchPosition(pos => {
    const latlng = [pos.coords.latitude, pos.coords.longitude];

    if (!liveMarker) {
      liveMarker = L.marker(latlng, { icon: liveIcon }).addTo(map);
    } else {
      liveMarker.setLatLng(latlng);
    }

    map.panTo(latlng, { animate: true });
  }, null, {
    enableHighAccuracy: true,
    maximumAge: 3000,
    timeout: 5000
  });
}

function cancelLive() {
  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  if (liveMarker) map.removeLayer(liveMarker);
  liveMarker = null;
}

// Routing
function showRoute(from, to) {
  cancelRoute();
  routeControl = L.Routing.control({
    waypoints: [from, L.latLng(to)],
    addWaypoints: false,
    draggableWaypoints: false,
    routeWhileDragging: false,
    show: false
  }).addTo(map);
}

function cancelRoute() {
  if (routeControl) map.removeControl(routeControl);
  routeControl = null;
}

// Init
loadLocations();
