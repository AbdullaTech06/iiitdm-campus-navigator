document.addEventListener("DOMContentLoaded", () => {
  // ===================
  // SUPABASE CONFIG
  // ===================
  const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
  const SUPABASE_KEY = "sb_publishable_w33IEM4ohCVNL__Z14grpg_DwJR6DJ4";
  
  let supabase = null;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Supabase connected");
  } catch (error) {
    console.error("❌ Supabase initialization error:", error);
  }

  // ===================
  // MAP INIT (Center coordinates hidden)
  // ===================
  const mapCenter = [15.759267, 78.037734];
  
  const map = L.map("map", {
    minZoom: 15,
    maxZoom: 19
  }).setView(mapCenter, 17);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  let userMarker = null;
  let accuracyCircle = null;
  let routingControl = null;
  let userLatLng = null;
  let allMarkers = [];
  let allLocations = [];

  // ===================
  // RED THEME COLORS
  // ===================
  const categoryColors = {
    academic: "#dc2626",
    department: "#ef4444",
    library: "#f87171",
    hostel: "#fb923c",
    dining: "#dc2626",
    sports: "#b91c1c",
    admin: "#991b1b",
    medical: "#fca5a5",
    facility: "#ef4444",
    entrance: "#f97316",
    default: "#dc2626"
  };

  // ===================
  // LIVE LOCATION WITH ACCURACY CIRCLE
  // ===================
  document.getElementById("liveBtn").addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLatLng = [pos.coords.latitude, pos.coords.longitude];
        const accuracy = pos.coords.accuracy;

        // Remove old marker and circle
        if (userMarker) {
          map.removeLayer(userMarker);
        }
        if (accuracyCircle) {
          map.removeLayer(accuracyCircle);
        }

        // Add accuracy circle (red theme)
        accuracyCircle = L.circle(userLatLng, {
          color: "#dc2626",
          fillColor: "#ef4444",
          fillOpacity: 0.15,
          weight: 2,
          radius: accuracy
        }).addTo(map);

        // Add user marker
        userMarker = L.marker(userLatLng, {
          icon: L.divIcon({
            className: "user-location-marker",
            html: '<div class="pulse-marker">📍</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map);

        map.setView(userLatLng, 18);
        
        // Update info panel
        document.getElementById("infoPanel").innerHTML = `
          <h3>✅ Location Enabled</h3>
          <p>Accuracy: ${Math.round(accuracy)}m • You can now navigate</p>
        `;
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Location permission denied or unavailable");
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });

  // ===================
  // CLEAR ROUTE
  // ===================
  document.getElementById("clearRouteBtn").addEventListener("click", () => {
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
      document.getElementById("infoPanel").innerHTML = `
        <h3>🏛️ IIITDM Kurnool Navigator</h3>
        <p>Route cleared. Search or click markers to navigate.</p>
      `;
    }
  });

  // ===================
  // LOAD LOCATIONS FROM SUPABASE
  // ===================
  async function loadLocations() {
    let locations = [];
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("Location")
          .select("*");
        
        if (error) {
          console.error("❌ Supabase error:", error.message);
          document.getElementById("infoPanel").innerHTML = `
            <h3>⚠️ Database Error</h3>
            <p>${error.message}</p>
          `;
          return;
        }
        
        if (data && data.length > 0) {
          locations = data;
          console.log("✅ Loaded", data.length, "locations from Supabase");
        } else {
          console.log("⚠️ No locations found in database");
          document.getElementById("infoPanel").innerHTML = `
            <h3>⚠️ No Locations</h3>
            <p>No locations found in database</p>
          `;
          return;
        }
      } catch (err) {
        console.error("❌ Error fetching locations:", err);
        document.getElementById("infoPanel").innerHTML = `
          <h3>⚠️ Error</h3>
          <p>Failed to load locations</p>
        `;
        return;
      }
    } else {
      document.getElementById("infoPanel").innerHTML = `
        <h3>⚠️ Database Not Connected</h3>
        <p>Supabase connection failed</p>
      `;
      return;
    }

    allLocations = locations;

    // Display locations on map
    locations.forEach((loc) => {
      const latLng = [loc.Lat, loc.Lng];
      const color = categoryColors[loc.Category?.toLowerCase()] || categoryColors.default;
      
      // Create custom marker icon (red theme)
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: ${color};
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      
      // Create marker
      const marker = L.marker(latLng, {
        icon: customIcon,
      }).addTo(map);

      // Bind popup with red theme
      marker.bindPopup(`
        <div style="text-align: center; min-width: 200px;">
          <b style="font-size: 16px; color: ${color};">${loc.Name}</b><br/>
          <span style="font-size: 12px; color: #666; text-transform: uppercase;">
            ${loc.Category || 'Location'}
          </span><br/>
          <span style="font-size: 13px; color: #444;">${loc.Description || ""}</span>
          <br/><br/>
          <button 
            onclick="navigateTo(${loc.Lat}, ${loc.Lng}, '${loc.Name.replace(/'/g, "\\'")}')"
            style="
              padding: 10px 20px;
              background: ${color};
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
              box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
            "
          >
            🧭 Navigate Here
          </button>
        </div>
      `);

      // Add label
      L.marker(latLng, {
        icon: L.divIcon({
          className: "building-label",
          html: `<span style="
            background: white;
            padding: 3px 8px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            font-size: 11px;
            font-weight: 700;
            color: #1e293b;
            border-left: 3px solid ${color};
          ">${loc.Name}</span>`,
          iconSize: [200, 20],
          iconAnchor: [100, -10],
        }),
      }).addTo(map);

      allMarkers.push({ marker, location: loc });
    });

    console.log(`✅ Displayed ${locations.length} locations on map`);
    
    // Update info panel
    document.getElementById("infoPanel").innerHTML = `
      <h3>🏛️ IIITDM Kurnool Navigator</h3>
      <p>${locations.length} locations loaded • Use search or click markers</p>
    `;
  }

  loadLocations();

  // ===================
  // SEARCH FUNCTIONALITY
  // ===================
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
      searchResults.innerHTML = "";
      searchResults.style.display = "none";
      return;
    }

    // Filter locations
    const filtered = allLocations.filter(loc => 
      loc.Name.toLowerCase().includes(query) ||
      (loc.Description && loc.Description.toLowerCase().includes(query)) ||
      (loc.Category && loc.Category.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
      searchResults.innerHTML = `
        <div class="search-result-item" style="color: #999;">
          No results found for "${query}"
        </div>
      `;
      searchResults.style.display = "block";
      return;
    }

    // Display results (red theme)
    searchResults.innerHTML = filtered.map(loc => {
      const color = categoryColors[loc.Category?.toLowerCase()] || categoryColors.default;
      return `
        <div class="search-result-item" onclick="selectLocation(${loc.Lat}, ${loc.Lng}, '${loc.Name.replace(/'/g, "\\'")}')">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${color};
            "></div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 14px;">${loc.Name}</div>
              <div style="font-size: 12px; color: #666;">${loc.Description || loc.Category}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");
    
    searchResults.style.display = "block";
  });

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = "none";
    }
  });

  // ===================
  // SELECT LOCATION FROM SEARCH
  // ===================
  window.selectLocation = function(lat, lng, name) {
    map.setView([lat, lng], 18);
    searchResults.style.display = "none";
    searchInput.value = "";
    
    // Find and open popup
    allMarkers.forEach(({ marker, location }) => {
      if (location.Lat === lat && location.Lng === lng) {
        marker.openPopup();
      }
    });

    // Update info panel
    document.getElementById("infoPanel").innerHTML = `
      <h3>📍 ${name}</h3>
      <p>Click "Navigate Here" in the popup to get directions</p>
    `;
  };

  // ===================
  // ROUTING (RED THEME)
  // ===================
  window.navigateTo = function (lat, lng, name) {
    if (!userLatLng) {
      alert("Please enable live location first by clicking the 📍 button");
      return;
    }

    if (routingControl) {
      map.removeControl(routingControl);
    }

    try {
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
          styles: [{ color: "#dc2626", weight: 6, opacity: 0.8 }], // Red route
        },
        createMarker: function () {
          return null;
        },
      }).addTo(map);

      // Update info panel
      document.getElementById("infoPanel").innerHTML = `
        <h3>🧭 Navigating to ${name}</h3>
        <p>Follow the red route on the map</p>
      `;

      // Fit map to route
      setTimeout(() => {
        if (routingControl && routingControl.getPlan()) {
          const waypoints = routingControl.getPlan().getWaypoints();
          const bounds = L.latLngBounds(
            waypoints.map((wp) => wp.latLng)
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }, 500);
    } catch (error) {
      console.error("Routing error:", error);
      alert("Error creating route. Please try again.");
    }
  };
});
