
// IIITDM Kurnool coordinates (approximate)
const iiitdm = [15.8182, 78.0373];

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
