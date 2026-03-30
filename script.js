let client = null;
let manuallyDisconnected = false;
let currentTempTopic = "";

const hostInput = document.getElementById("host");
const portInput = document.getElementById("port");
const clientIdInput = document.getElementById("clientId");
const statusSpan = document.getElementById("status");

const tempTopicInput = document.getElementById("tempTopic");
const subTopicInput = document.getElementById("subTopic");
const pubTopicInput = document.getElementById("pubTopic");
const messageInput = document.getElementById("message");

const locationOutput = document.getElementById("locationOutput");
const temperatureOutput = document.getElementById("temperatureOutput");
const messagesDiv = document.getElementById("messages");

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const subscribeBtn = document.getElementById("subscribeBtn");
const subscribeTempBtn = document.getElementById("subscribeTempBtn");
const publishBtn = document.getElementById("publishBtn");
const shareStatusBtn = document.getElementById("shareStatusBtn");

let map = L.map("map").setView([51.0447, -114.0719], 11);
let locationMarker = null;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

function addMessage(text) {
  const p = document.createElement("p");
  p.textContent = text;
  messagesDiv.prepend(p);
}

function generateClientId() {
  return "client_" + Math.random().toString(16).slice(2, 10);
}

function setConnectionInputsDisabled(disabled) {
  hostInput.disabled = disabled;
  portInput.disabled = disabled;
}

function getBrokerUrl() {
  const host = hostInput.value.trim();
  const port = portInput.value.trim();
  return `wss://${host}:${port}`;
}

function getTemperatureColor(temp) {
  if (temp <= 10) return "blue";
  if (temp < 30) return "green";
  return "red";
}

function createMarkerIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div class="custom-marker marker-${color}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
}

function updateMap(lat, lon, temp) {
  const color = getTemperatureColor(temp);
  const icon = createMarkerIcon(color);
  const popupText = `Temperature: ${temp} °C`;

  if (locationMarker) {
    locationMarker.setLatLng([lat, lon]);
    locationMarker.setIcon(icon);
    locationMarker.setPopupContent(popupText);
  } else {
    locationMarker = L.marker([lat, lon], { icon }).addTo(map);
    locationMarker.bindPopup(popupText);
  }

  map.setView([lat, lon], 13);
}

function subscribeToTopic(topic) {
  if (!client || !client.connected) {
    addMessage("Cannot subscribe: not connected to broker.");
    return;
  }

  client.subscribe(topic, (err) => {
    if (err) {
      addMessage(`Subscribe failed for topic: ${topic}`);
    } else {
      addMessage(`Subscribed to: ${topic}`);
    }
  });
}

function publishMessage(topic, message) {
  if (!client || !client.connected) {
    addMessage("Cannot publish: not connected to broker.");
    return;
  }

  client.publish(topic, message);
  addMessage(`Published to ${topic}: ${message}`);
}

function handleIncomingMessage(topic, payloadText) {
  try {
    const parsed = JSON.parse(payloadText);

    if (
      parsed &&
      parsed.type === "Feature" &&
      parsed.geometry &&
      parsed.geometry.type === "Point" &&
      Array.isArray(parsed.geometry.coordinates) &&
      parsed.properties &&
      parsed.properties.temperature !== undefined
    ) {
      const lon = parsed.geometry.coordinates[0];
      const lat = parsed.geometry.coordinates[1];
      const temp = Number(parsed.properties.temperature);

      locationOutput.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`;
      temperatureOutput.textContent = `Temperature: ${temp} °C`;

      updateMap(lat, lon, temp);

      addMessage(
        `Received GeoJSON on ${topic}: Latitude ${lat.toFixed(6)}, Longitude ${lon.toFixed(6)}, Temperature ${temp} °C`
      );
      return;
    }

    addMessage(`Received on ${topic}: ${payloadText}`);
  } catch {
    addMessage(`Received on ${topic}: ${payloadText}`);
  }
}

startBtn.addEventListener("click", () => {
  if (client && client.connected) {
    addMessage("Already connected.");
    return;
  }

  manuallyDisconnected = false;

  const brokerUrl = getBrokerUrl();
  const clientId = clientIdInput.value.trim() || generateClientId();
  currentTempTopic = tempTopicInput.value.trim();

  client = mqtt.connect(brokerUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 3000
  });

  setConnectionInputsDisabled(true);
  statusSpan.textContent = "Connecting...";
  addMessage(`Attempting connection to ${brokerUrl} with client ID: ${clientId}`);

  client.on("connect", () => {
    statusSpan.textContent = "Connected";
    addMessage(`Connected to broker with client ID: ${clientId}`);

    if (currentTempTopic) {
      subscribeToTopic(currentTempTopic);
    }
  });

  client.on("reconnect", () => {
    statusSpan.textContent = "Reconnecting...";
    addMessage("Connection lost. Attempting automatic reconnection...");
  });

  client.on("close", () => {
    if (manuallyDisconnected) {
      statusSpan.textContent = "Disconnected";
      addMessage("Connection ended by user.");
    } else {
      statusSpan.textContent = "Disconnected / Reconnecting...";
      addMessage("Disconnected from broker. Automatic reconnection is enabled.");
    }
  });

  client.on("error", (error) => {
    statusSpan.textContent = "Error";
    addMessage(`Connection error: ${error.message}`);
  });

  client.on("message", (topic, message) => {
    handleIncomingMessage(topic, message.toString());
  });
});

endBtn.addEventListener("click", () => {
  if (!client) {
    addMessage("No active connection to end.");
    return;
  }

  manuallyDisconnected = true;
  client.end(true);
  setConnectionInputsDisabled(false);
  statusSpan.textContent = "Disconnected";
});

subscribeBtn.addEventListener("click", () => {
  const topic = subTopicInput.value.trim();
  subscribeToTopic(topic);
});

subscribeTempBtn.addEventListener("click", () => {
  const topic = tempTopicInput.value.trim();
  currentTempTopic = topic;
  subscribeToTopic(topic);
});

publishBtn.addEventListener("click", () => {
  const topic = pubTopicInput.value.trim();
  const message = messageInput.value.trim();

  if (!message) {
    addMessage("Please enter a message before publishing.");
    return;
  }

  publishMessage(topic, message);
});

shareStatusBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    addMessage("Geolocation is not supported by this browser.");
    return;
  }

  if (!client || !client.connected) {
    addMessage("Connect to the broker before sharing your status.");
    return;
  }

  const topic = tempTopicInput.value.trim();
  currentTempTopic = topic;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = Number(position.coords.latitude.toFixed(6));
      const lon = Number(position.coords.longitude.toFixed(6));
      const temp = Math.floor(Math.random() * 101) - 40; // -40 to 60

      locationOutput.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`;
      temperatureOutput.textContent = `Temperature: ${temp} °C`;

      const geojsonMessage = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat]
        },
        properties: {
          temperature: temp
        }
      };

      const payload = JSON.stringify(geojsonMessage);

      publishMessage(topic, payload);
      updateMap(lat, lon, temp);
    },
    (error) => {
      addMessage(`Geolocation error: ${error.message}`);
    }
  );
});