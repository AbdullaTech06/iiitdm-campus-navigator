document.addEventListener("DOMContentLoaded", () => {

  /* ===== SUPABASE ===== */
  const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
  const SUPABASE_KEY = "PASTE_YOUR_ANON_KEY_HERE"; // <-- YOUR REAL KEY

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  /* ===== MAP ===== */
  const map = L.map("map").setView([15.759267, 78.037734], 17);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  /* ===== STATE ===== */
  let locations = [];
  let userMarker = null;
  let watchId = null;
  let routingControl = null;
  let destination = null;

  /* ===== LOAD LOCATIONS ===== */
  async function loadLocations() {
    const { data, error } = await supabase
      .from("Location")
      .select("Name, Lat, Lng, Category, Description");

    if (error) {
      document.getElementById("infoPanel").innerHTML =
        "<p>❌ Failed to load locations</p>";
      return;
    }

    locations = data;

    data.forEach(loc => {
      const marker = L.circleMarker([loc.Lat, loc.Lng], {
        radius: 6,
        color: "#dc2626",
        fillColor: "#ef4444",
        fillOpacity: 1
      }).addTo(map);

      marker.bindPopup(`
        <b>${loc.Name}</b><br>
        <small>${loc.Category || ""}</small><br>
        <p>${loc.Description || ""}</p>
        <button onclick="startRoute(${loc.Lat}, ${loc.Lng})"
          style="margin-top:6px;padding:6px 10px;background:#dc2626;color:white;border:none;border-radius:6px">
          🧭 Navigate
        </button>
      `);
    });

    document.getElementById("infoPanel").innerHTML =
      `<p>${data.length} locations loaded</p>`;
  }

  loadLocations();

  /* ===== SEARCH ===== */
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    if (q.length < 2) {
      searchResults.style.display = "none";
      return;
    }

    const matches = locations.filter(l =>
      l.Name.toLowerCase().includes(q) ||
      (l.Category || "").toLowerCase().includes(q)
    );

    searchResults.innerHTML = matches.map(l => `
      <div class="search-item"
        onclick="focusLocation(${l.Lat}, ${l.Lng})">
        <b>${l.Name}</b><br>
        <small>${l.Category || ""}</small>
      </div>
    `).join("");

    searchResults.style.display = "block";
  });

  window.focusLocation = (lat, lng) => {
    map.setView([lat, lng], 18);
    searchResults.style.display = "none";
  };

  /* ===== LIVE LOCATION ===== */
  document.getElementById("liveBtn").onclick = () => {
    if (watchId) return;

    watchId = navigator.geolocation.watchPosition(pos => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];

      if (!userMarker) {
        userMarker = L.marker(latlng).addTo(map);
      } else {
        userMarker.setLatLng(latlng);
      }

      if (destination) updateRoute(latlng, destination);
    });
  };

  document.getElementById("stopLiveBtn").onclick = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
  };

  /* ===== ROUTING ===== */
  window.startRoute = (lat, lng) => {
    if (!userMarker) {
      alert("Start live location first");
      return;
    }
    destination = [lat, lng];
    updateRoute(userMarker.getLatLng(), destination);
  };

  function updateRoute(from, to) {
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: { styles: [{ color: "#dc2626", weight: 6 }] },
      createMarker: () => null
    }).addTo(map);
  }

  document.getElementById("cancelRouteBtn").onclick = () => {
    if (routingControl) map.removeControl(routingControl);
    routingControl = null;
    destination = null;
  };

});
