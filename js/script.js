
// IIITDM Kurnool coordinates (approximate)
const iiitdm = [15.761582887969185, 78.03882959332657];

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
