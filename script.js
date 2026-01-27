document.addEventListener("DOMContentLoaded", () => {

  /* ================= SUPABASE ================= */
  const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  /* ================= MAP ================= */
  const map = L.map("map", {
    minZoom: 15,
    maxZoom: 19
  }).setView([15.759267, 78.037734], 17);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  let locations = [];
  let markers = [];
  let userLatLng = null;
  let routingControl = null;

  /* ================= LOAD LOCATIONS ================= */
  async function loadLocations() {
    const { data, error } = await supabase.from("Location").select("*");

    if (error) {
      document.getElementById("infoPanel").innerHTML =
        "<h3>⚠️ Error</h3><p>Database load failed</p>";
      return;
    }

    locations = data;

    data.forEach(loc => {
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 7,
        color: "#dc2626",
        fillColor: "#ef4444",
        fillOpacity: 1
      }).addTo(map);

      marker.bindPopup(`
        <b>${loc.name}</b><br>
        <small>${loc.category || ""}</small><br><br>
        <button onclick="navigateTo(${loc.lat}, ${loc.lng}, '${loc.name}')"
          style="padding:8px 12px;background:#dc2626;color:white;border:none;border-radius:6px">
          🧭 Navigate Here
        </button>
      `);

      markers.push({ marker, loc });
    });

    document.getElementById("infoPanel").innerHTML =
      `<h3>🏛️ IIITDM Navigator</h3><p>${data.length} locations loaded</p>`;
  }

  loadLocations();

  /* ================= SEARCH ================= */
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    if (q.length < 2) {
      searchResults.style.display = "none";
      return;
    }

    const filtered = locations.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.category || "").toLowerCase().includes(q)
    );

    searchResults.innerHTML = filtered.map(l => `
      <div class="search-item"
        onclick="selectLocation(${l.lat}, ${l.lng}, '${l.name}')">
        <b>${l.name}</b><br>
        <small>${l.category || ""}</small>
      </div>
    `).join("");

    searchResults.style.display = "block";
  });

  window.selectLocation = (lat, lng, name) => {
    map.setView([lat, lng], 18);
    searchResults.style.display = "none";
    document.getElementById("infoPanel").innerHTML =
      `<h3>📍 ${name}</h3><p>Tap Navigate Here</p>`;
  };

  /* ================= LIVE LOCATION ================= */
  document.getElementById("liveBtn").onclick = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      userLatLng = [pos.coords.latitude, pos.coords.longitude];
      L.marker(userLatLng).addTo(map);
      map.setView(userLatLng, 18);
    });
  };

  /* ================= ROUTING ================= */
  window.navigateTo = (lat, lng, name) => {
    if (!userLatLng) {
      alert("Enable live location first");
      return;
    }

    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLatLng),
        L.latLng(lat, lng)
      ],
      lineOptions: {
        styles: [{ color: "#dc2626", weight: 6 }]
      },
      createMarker: () => null
    }).addTo(map);

    document.getElementById("infoPanel").innerHTML =
      `<h3>🧭 Navigating</h3><p>${name}</p>`;
  };

  document.getElementById("clearRouteBtn").onclick = () => {
    if (routingControl) map.removeControl(routingControl);
  };

});
