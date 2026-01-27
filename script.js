document.addEventListener("DOMContentLoaded", () => {

  // ===================
  // SUPABASE CONFIG
  // ===================
  const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
  const SUPABASE_KEY = "PASTE_YOUR_PUBLIC_ANON_KEY_HERE";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  // ===================
  // MAP INIT
  // ===================
  const map = L.map("map").setView(
    [15.7695, 78.0664], // IIITDM Kurnool
    17
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

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

        if (!userMarker) {
          userMarker = L.marker(userLatLng).addTo(map);
        } else {
          userMarker.setLatLng(userLatLng);
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
      .from("location")   // 👈 lowercase table name
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    data.forEach(loc => {
      const latLng = [loc.lat, loc.lng];

      const marker = L.marker(latLng).addTo(map);

      marker.bindPopup(`
        <b>${loc.name}</b><br/>
        ${loc.description || ""}
        <br/><br/>
        <button onclick="navigateTo(${loc.lat}, ${loc.lng})">
          Navigate
        </button>
      `);

      L.marker(latLng, {
        icon: L.divIcon({
          className: "building-label",
          html: loc.name,
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
        styles: [{ color: "#2563eb", weight: 6 }],
      },
    }).addTo(map);
  };

});
