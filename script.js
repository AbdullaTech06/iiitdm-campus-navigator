// ===================
// SUPABASE CONFIG
// ===================
const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY =
  "sb_publishable_w33IEM4ohCVNL__Z14grpg_DwJR6DJ4";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ===================
// MAP INIT
// ===================
const map = L.map("map").setView(
  [15.7695, 78.0664], // IIITDM Kurnool approx
  17
);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// ===================
// GLOBAL VARIABLES
// ===================
let userMarker = null;
let routingControl = null;
let userLatLng = null;

// ===================
// LIVE LOCATION
// ===================
document.getElementById("liveBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLatLng = [pos.coords.latitude, pos.coords.longitude];

      if (userMarker) {
        userMarker.setLatLng(userLatLng);
      } else {
        userMarker = L.marker(userLatLng, {
          icon: L.icon({
            iconUrl:
              "https://cdn-icons-png.flaticon.com/512/684/684908.png",
            iconSize: [35, 35],
          }),
        })
          .addTo(map)
          .bindPopup("You are here");
      }

      map.setView(userLatLng, 18);
    },
    () => alert("Location permission denied")
  );
});

// ===================
// CLEAR ROUTE
// ===================
document.getElementById("clearRouteBtn").addEventListener("click", () => {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
});

// ===================
// LOAD LOCATIONS
// ===================
async function loadLocations() {
  const { data, error } = await supabase
    .from("Location")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((loc) => {
    const latLng = [loc.Lat, loc.Lng];

    // Marker
    const marker = L.marker(latLng).addTo(map);

    marker.bindPopup(`
      <b>${loc.Name}</b><br/>
      ${loc.Description || ""}
      <br/><br/>
      <button onclick="navigateTo(${loc.Lat}, ${loc.Lng})">
        Navigate
      </button>
    `);

    // Name on map
    L.marker(latLng, {
      icon: L.divIcon({
        className: "building-label",
        html: loc.Name,
        iconSize: [160, 20],
        iconAnchor: [80, -10],
      }),
    }).addTo(map);
  });
}

loadLocations();

// ===================
// ROUTING
// ===================
window.navigateTo = function (lat, lng) {
  if (!userLatLng) {
    alert("Enable live location first");
    return;
  }

  if (routingControl) {
    map.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(userLatLng[0], userLatLng[1]),
      L.latLng(lat, lng),
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    show: false,
    lineOptions: {
      styles: [{ weight: 6 }],
    },
  }).addTo(map);
};
