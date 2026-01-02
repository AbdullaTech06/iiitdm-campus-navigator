
// IIITDM Kurnool coordinates (approximate)
const iiitdm = [15.76121932151381, 78.03870039774452];

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


map.on("click", function (e) {
    alert("Latitude: " + e.latlng.lat + "\nLongitude: " + e.latlng.lng);
});

