
// IIITDM Kurnool coordinates (approximate)
const iiitdm = [15.760660741729295,78.03753984103145];

// Create map
const map = L.map("map").setView(iiitdm, 16);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Marker
L.marker(iiitdm)
    .addTo(map)
    .bindPopup("IIITDM Kurnool Campus")
    .openPopup();

let userMarker = null;

document.getElementById("locateBtn").addEventListener("click", function () {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const userLocation = [lat, lng];

        if (userMarker) {
            map.removeLayer(userMarker); // remove old marker
        }

        userMarker = L.marker(userLocation)
            .addTo(map)
            .bindPopup("📍 You are here")
            .openPopup();

        map.setView(userLocation, 18);
    }, function () {
        alert("Unable to get your location");
    });
});

