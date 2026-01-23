document.addEventListener("DOMContentLoaded", () => {

    /* ===== SUPABASE ===== */
    const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
    const SUPABASE_KEY = "sb_publishable_w33IEM4ohCVNL__Z14grpg_DwJR6DJ4";

    const supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    /* ===== MAP ===== */
    const LABEL_ZOOM = 17;
    const campusCenter = [15.758844, 78.037691];

    const map = L.map("map").setView(campusCenter, 18);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(map);

    let markers = [];
    let activeCategory = "ALL";

    /* ===== ROUTING ===== */
    let userLocation = null;
    let routeLine = null;

    /* ===== LOAD LOCATIONS ===== */
    async function loadLocations() {
        const { data } = await supabase.from("Location").select("*");

        const categories = new Set();

        data.forEach(loc => {
            if (!loc.Lat || !loc.Lng) return;

            categories.add(loc.Category);

            const marker = L.circleMarker(
                [Number(loc.Lat), Number(loc.Lng)],
                {
                    radius: 6,
                    color: "#dc3545",
                    fillColor: "#dc3545",
                    fillOpacity: 1,
                    weight: 2
                }
            ).addTo(map);

            marker.bindTooltip(loc.Name, {
                permanent: true,
                direction: "top",
                offset: [0, -8],
                className: "building-label"
            });

            marker.bindPopup(`
                <b>${loc.Name}</b><br>
                <small>${loc.Category}</small><br>
                ${loc.Description ?? ""}<br><br>
                <button onclick="navigateTo(${loc.Lat}, ${loc.Lng})">
                    Navigate
                </button>
            `);

            markers.push({ marker, category: loc.Category, name: loc.Name });
        });

        buildFilters([...categories]);
        updateLabels();
    }

    /* ===== FILTERS ===== */
    function buildFilters(categories) {
        const container = document.getElementById("filters");

        ["ALL", ...categories].forEach(cat => {
            const btn = document.createElement("button");
            btn.textContent = cat;
            btn.className = "filter-btn";
            if (cat === "ALL") btn.classList.add("active");

            btn.onclick = () => {
                document
                    .querySelectorAll(".filter-btn")
                    .forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                activeCategory = cat;
                applyFilters();
            };

            container.appendChild(btn);
        });
    }

    function applyFilters() {
        markers.forEach(m => {
            const visible =
                activeCategory === "ALL" ||
                m.category === activeCategory;

            if (visible) {
                m.marker.addTo(map);
            } else {
                map.removeLayer(m.marker);
            }
        });
    }

    /* ===== SEARCH ===== */
    document.getElementById("searchBox").addEventListener("keydown", e => {
        if (e.key !== "Enter") return;

        const q = e.target.value.toLowerCase();

        const found = markers.find(m =>
            m.name.toLowerCase().includes(q)
        );

        if (!found) {
            alert("Building not found");
            return;
        }

        map.setView(found.marker.getLatLng(), 18);
        found.marker.openPopup();

        const el = found.marker.getElement();
        el.classList.add("highlight");
        setTimeout(() => el.classList.remove("highlight"), 3000);
    });

    /* ===== LABEL VISIBILITY ===== */
    function updateLabels() {
        const show = map.getZoom() >= LABEL_ZOOM;
        markers.forEach(m => {
            show ? m.marker.openTooltip() : m.marker.closeTooltip();
        });
    }

    map.on("zoomend", updateLabels);

    /* ===== LIVE LOCATION ===== */
    let userMarker = null;
    let accuracyCircle = null;

    document.getElementById("locateBtn").onclick = () => {
        navigator.geolocation.watchPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            userLocation = [lat, lng];

            if (!userMarker) {
                userMarker = L.circleMarker(userLocation, {
                    radius: 8,
                    color: "#0d6efd",
                    fillColor: "#0d6efd",
                    fillOpacity: 1
                }).addTo(map);

                accuracyCircle = L.circle(userLocation, {
                    radius: pos.coords.accuracy,
                    color: "#0d6efd",
                    fillOpacity: 0.1
                }).addTo(map);
            } else {
                userMarker.setLatLng(userLocation);
                accuracyCircle.setLatLng(userLocation);
            }

            map.setView(userLocation, 18);
        });
    };

    /* ===== ROUTE ===== */
    window.navigateTo = async (lat, lng) => {
        if (!userLocation) {
            alert("Enable live location first");
            return;
        }

        if (routeLine) map.removeLayer(routeLine);

        const url =
            `https://router.project-osrm.org/route/v1/foot/` +
            `${userLocation[1]},${userLocation[0]};${lng},${lat}` +
            `?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const json = await res.json();

        const coords = json.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

        routeLine = L.polyline(coords, {
            color: "#0d6efd",
            weight: 4
        }).addTo(map);

        document.getElementById("clearRouteBtn").classList.remove("hidden");
    };

    document.getElementById("clearRouteBtn").onclick = () => {
        if (routeLine) map.removeLayer(routeLine);
        routeLine = null;
        document.getElementById("clearRouteBtn").classList.add("hidden");
    };

    loadLocations();
});
