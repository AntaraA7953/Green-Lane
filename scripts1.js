const apiKey = "cdf3fe6585305f2c28044acdd6fcd3ad";

window.onload = function () {
  const overlay = document.getElementById("introImageOverlay");
  setTimeout(() => {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 1500);
  }, 2500);
};

const map = L.map('map').setView([28.6139, 77.2090], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let routeControls = [];

async function geocode(place) {
  const res = await fetch(https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)});
  const data = await res.json();
  if (data.length === 0) throw new Error("Place not found");
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

function getColorByEcoScore(score) {
  if (score >= 75) return "green";
  if (score >= 50) return "orange";
  if (score >= 25) return "yellow";
  return "red";
}

function getRandomEcoScore() {
  return Math.floor(Math.random() * 100);
}

async function getEcoRoute() {
  const src = document.getElementById("source").value;
  const dest = document.getElementById("destination").value;
  const mode = document.getElementById("mode").value;

  if (!src || !dest) {
    alert("Please enter both places");
    return;
  }

  try {
    const [lat1, lon1] = await geocode(src);
    const [lat2, lon2] = await geocode(dest);

    routeControls.forEach(ctrl => map.removeControl(ctrl));
    routeControls = [];
    document.getElementById("routeDetails").innerHTML = "";

    const ecoScores = [getRandomEcoScore(), getRandomEcoScore(), getRandomEcoScore()];
    const colors = ecoScores.map(getColorByEcoScore);

    ecoScores.forEach((ecoScore, index) => {
      const color = colors[index];

      const control = L.Routing.control({
        waypoints: [L.latLng(lat1 + Math.random() * 0.01, lon1 + Math.random() * 0.01), L.latLng(lat2, lon2)],
        lineOptions: {
          styles: [{ color, opacity: 0.8, weight: 6 }]
        },
        createMarker: () => null,
        addWaypoints: false,
        draggableWaypoints: false,
        show: false
      }).addTo(map);

      control.on('routesfound', async e => {
        const r = e.routes[0];
        const dist = (r.summary.totalDistance / 1000).toFixed(1);
        const time = (r.summary.totalTime / 60).toFixed(1);

        const mid = r.coordinates[Math.floor(r.coordinates.length / 2)];

        const weatherRes = await fetch(https://api.openweathermap.org/data/2.5/weather?lat=${mid.lat}&lon=${mid.lng}&appid=${apiKey}&units=metric);
        const weather = await weatherRes.json();

        const airRes = await fetch(https://api.openweathermap.org/data/2.5/air_pollution?lat=${mid.lat}&lon=${mid.lng}&appid=${apiKey});
        const air = await airRes.json();
        const aqi = air.list[0].main.aqi;
        const aqiText = ["Good", "Fair", "Moderate", "Poor", "Very Poor"][aqi - 1];

        document.getElementById("routeDetails").innerHTML += `
          <b>Route ${index + 1}:</b><br>
          <b>Distance:</b> ${dist} km<br>
          <b>Time:</b> ${time} mins<br>
          <b>Eco Score:</b> ${ecoScore}/100
          <div class="eco-bar-container"><div class="eco-bar" style="width:${ecoScore}%; background:${color};"></div></div>
          <br><b>Weather:</b> ${weather.weather[0].main}, ${weather.main.temp}°C<br>
          <b>Air Quality:</b> ${aqiText}<br><br>
        `;
      });

      routeControls.push(control);
    });
  } catch (err) {
    alert("Error loading route. Try again.");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}