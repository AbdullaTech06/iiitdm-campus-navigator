/* ================= SUPABASE ================= */

const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* ================= MAP ================= */

const map = L.map("map", {
  minZoom: 16,
  maxZoom: 19
}).setView([15.8146, 78.0356], 17);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

/* ================= ICONS ================= */

const locationIcon = L.icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const liveIcon = L.icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-pushpin.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

/* ================= MARKERS ================= */

let markers = [];
let liveMarker = null;
let watchId = null;
let routingControl = null;
let currentPosition = null;
let selectedDestination = null;

/* ================= LOAD LOCATIONS ================= */

async function loadLocations() {
  const { data, error } = await supabase
    .from("Location")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(loc => {
    const marker = L.marker([loc.Lat, loc.Lng], {
      icon: locationIcon
    })
      .addTo(map)
      .bindPopup(`<b>${loc.Name}</b><br>${loc.Description}`);

    marker.on("click", () => {
      selectedDestination = [loc.Lat, loc.Lng];
    });

    markers.push({ name: loc.Name.toLowerCase(), marker });
  });
}

loadLocations();

/* ================= SEARCH ================= */

document.getElementById("search").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();

  markers.forEach(m => {
    if (m.name.includes(value)) {
      m.marker.addTo(map);
    } else {
      map.removeLayer(m.marker);
    }
  });
});

/* ================= LIVE LOCATION ================= */

document.getElementById("showLive").onclick = () => {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(pos => {
    currentPosition = [
      pos.coords.latitude,
      pos.coords.longitude
    ];

    if (!liveMarker) {
      liveMarker = L.marker(currentPosition, {
        icon: liveIcon
      }).addTo(map);
    } else {
      liveMarker.setLatLng(currentPosition);
    }

    if (routingControl && selectedDestination) {
      routingControl.setWaypoints([
        L.latLng(currentPosition),
        L.latLng(selectedDestination)
      ]);
    }
  });
};

document.getElementById("cancelLive").onclick = () => {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (liveMarker) {
    map.removeLayer(liveMarker);
    liveMarker = null;
  }
};

/* ================= ROUTING ================= */

document.getElementById("showRoute").onclick = () => {
  if (!currentPosition || !selectedDestination) return;

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(currentPosition),
      L.latLng(selectedDestination)
    ],
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true
  }).addTo(map);
};

document.getElementById("cancelRoute").onclick = () => {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
};
