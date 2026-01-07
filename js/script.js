
// Detect mobile vs laptop
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Initialize map (IIITDM Kurnool approx location)
const map = L.map("map").setView([15.7677, 78.3171], 18);

// Tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let samples = [];
let userMarker = null;
let accuracyCircle = null;

// Start GPS
function startGPS() {
  map.locate({
    watch: true,
    setView: true,
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0
  });
}

// When location is found
map.on("locationfound", function (e) {

  console.log("Accuracy:", e.accuracy);

  // Strict filter only for mobile
  if (isMobile && e.accuracy > 100) {
    console.log("Waiting for better accuracy...");
    return;
  }

  // Store samples
  samples.push(e.latlng);
  if (samples.length > 8) samples.shift();

  // Average samples
  let avgLat = 0, avgLng = 0;
  samples.forEach(p => {
    avgLat += p.lat;
    avgLng += p.lng;
  });

  avgLat /= samples.length;
  avgLng /= samples.length;

  const finalPos = [avgLat, avgLng];

  // Remove old marker
  if (userMarker) map.removeLayer(userMarker);
  if (accuracyCircle) map.removeLayer(accuracyCircle);

  // Add marker
  userMarker = L.marker(finalPos)
    .addTo(map)
    .bindPopup("📍 You are here")
    .openPopup();

  // Accuracy circle
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

// Laptop warning (optional)
if (!isMobile) {
  console.log("Desktop detected: GPS accuracy may be low");
}
