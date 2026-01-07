// Initialize map at IIITDM Kurnool (approx coordinates)
const map = L.map("map").setView([15.761821, 78.039614], 18);

// OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let samples = [];
let userMarker = null;
let accuracyCircle = null;

// Function to start GPS
function startGPS() {
  map.locate({
    watch: true,
    setView: true,
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0
  });
}

// Location found
map.on("locationfound", function (e) {

  // Ignore poor accuracy
  if (e.accuracy > 25) return;

  samples.push(e.latlng);
  if (samples.length > 8) samples.shift();

  let avgLat = 0, avgLng = 0;
  samples.forEach(p => {
    avgLat += p.lat;
    avgLng += p.lng;
  });

  avgLat /= samples.length;
  avgLng /= samples.length;

  const finalPos = [avgLat, avgLng];

  if (userMarker) map.removeLayer(userMarker);
  if (accuracyCircle) map.removeLayer(accuracyCircle);

  userMarker = L.marker(finalPos)
    .addTo(map)
    .bindPopup("📍 You are here")
    .openPopup();

  accuracyCircle = L.circle(finalPos, {
    radius: e.accuracy,
    color: "blue",
    fillOpacity: 0.2
  }).addTo(map);
});

// Error handling
map.on("locationerror", function (e) {
  alert("Location error: " + e.message);
});

// Button click
document.getElementById("locateBtn").addEventListener("click", startGPS);
