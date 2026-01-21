// ===== SUPABASE CONFIG =====
const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_w33IEM4ohCVNL__Z14grpg_DwJR6DJ4";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ===== CAMPUS MAP SETUP =====
const campusCenter = [15.758844, 78.037691];
const map = L.map("map", {
    center: campusCenter,
    zoom: 18,
    zoomControl: true,
    scrollWheelZoom: true
});

// OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Campus center marker
L.marker(campusCenter).addTo(map)
    .bindPopup("<b>Campus Center</b>");

// ===== LOAD BUILDINGS FROM SUPABASE =====
async function loadCampusLocations() {
    const { data, error } = await supabase
        .from("Location")
        .select("*");

    if (error) {
        console.error(error);
        showError("Failed to load campus locations");
        return;
    }

    data.forEach(loc => {
        if (!loc.Lat || !loc.Lng) return;

        const marker = L.circleMarker(
            [loc.Lat, loc.Lng],
            {
                radius: 6,
                color: "#dc3545",
                fillColor: "#dc3545",
                fillOpacity: 1,
                weight: 2
            }
        ).addTo(map);

        // Permanent building name label
        marker.bindTooltip(
            loc.Name,
            {
                permanent: true,
                direction: "top",
                offset: [0, -8],
                className: "building-label"
            }
        );

        // Optional popup
        marker.bindPopup(`
            <b>${loc.Name}</b><br>
            <small>${loc.Category}</small><br>
            ${loc.Description ?? ""}
        `);
    });
}

loadCampusLocations();

// ===== LIVE LOCATION TRACKING =====
let watchId = null;
let locationMarker = null;
let locationCircle = null;
let isTracking = false;
let tooltipShown = false;

const LocateControl = L.Control.extend({
    options: { position: "topright" },
    onAdd: function () {
        const container = L.DomUtil.create("div", "leaflet-bar");
        const button = L.DomUtil.create("div", "leaflet-control-locate", container);
        button.innerHTML = "📍";
        button.title = "Show my location";

        button.onclick = () => toggleLocationTracking(button);
        return container;
    }
});

map.addControl(new LocateControl());

function toggleLocationTracking(button) {
    if (isTracking) stopTracking(button);
    else startTracking(button);
}

function startTracking(button) {
    hideError();

    if (!navigator.geolocation) {
        showError("Geolocation not supported");
        return;
    }

    button.classList.add("active");
    isTracking = true;

    if (!tooltipShown) {
        showTooltip();
        tooltipShown = true;
    }

    watchId = navigator.geolocation.watchPosition(
        onLocationSuccess,
        onLocationError,
        { enableHighAccuracy: true }
    );
}

function stopTracking(button) {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    isTracking = false;
    button.classList.remove("active");

    if (locationMarker) map.removeLayer(locationMarker);
    if (locationCircle) map.removeLayer(locationCircle);
}

function onLocationSuccess(pos) {
    const { latitude, longitude, accuracy } = pos.coords;

    if (locationMarker) map.removeLayer(locationMarker);
    if (locationCircle) map.removeLayer(locationCircle);

    locationCircle = L.circle(
        [latitude, longitude],
        { radius: accuracy, color: "#dc3545", fillOpacity: 0.1 }
    ).addTo(map);

    locationMarker = L.circleMarker(
        [latitude, longitude],
        { radius: 8, color: "#fff", fillColor: "#dc3545", fillOpacity: 1, weight: 2 }
    ).addTo(map)
     .bindPopup("You are here");

    map.setView([latitude, longitude], map.getZoom());
}

function onLocationError() {
    showError("Unable to get your location");
}

// ===== UI HELPERS =====
function showError(msg) {
    const el = document.getElementById("error-message");
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(hideError, 4000);
}

function hideError() {
    document.getElementById("error-message").classList.add("hidden");
}

function showTooltip() {
    const el = document.getElementById("location-tooltip");
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 3000);
}
