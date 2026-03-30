let client = null;

const brokerInput = document.getElementById("broker");
const clientIdInput = document.getElementById("clientId");
const statusSpan = document.getElementById("status");

const subTopicInput = document.getElementById("subTopic");
const pubTopicInput = document.getElementById("pubTopic");
const messageInput = document.getElementById("message");

const messagesDiv = document.getElementById("messages");
const locationOutput = document.getElementById("locationOutput");

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const subscribeBtn = document.getElementById("subscribeBtn");
const publishBtn = document.getElementById("publishBtn");
const locationBtn = document.getElementById("locationBtn");

function addMessage(text) {
  const p = document.createElement("p");
  p.textContent = text;
  messagesDiv.prepend(p);
}

function generateClientId() {
  return "client_" + Math.random().toString(16).substring(2, 10);
}

connectBtn.addEventListener("click", () => {
  const broker = brokerInput.value.trim();
  const clientId = clientIdInput.value.trim() || generateClientId();

  client = mqtt.connect(broker, {
    clientId: clientId,
    clean: true,
    connectTimeout: 4000
  });

  statusSpan.textContent = "Connecting...";

  client.on("connect", () => {
    statusSpan.textContent = "Connected";
    addMessage("Connected to broker with client ID: " + clientId);
  });

  client.on("message", (topic, message) => {
  const messageText = message.toString();

  try {
    const parsed = JSON.parse(messageText);

    if (parsed.latitude !== undefined && parsed.longitude !== undefined) {
      addMessage(
        `Received on ${topic}: Latitude ${parsed.latitude}, Longitude ${parsed.longitude}`
      );
    } else {
      addMessage(`Received on ${topic}: ${messageText}`);
    }
  } catch {
    addMessage(`Received on ${topic}: ${messageText}`);
  }
  });

  client.on("error", (error) => {
    statusSpan.textContent = "Error";
    addMessage("Connection error: " + error.message);
  });

  client.on("close", () => {
    statusSpan.textContent = "Disconnected";
    addMessage("Disconnected from broker");
  });
});

disconnectBtn.addEventListener("click", () => {
  if (client) {
    client.end();
  }
});

subscribeBtn.addEventListener("click", () => {
  if (!client) {
    addMessage("Not connected to broker");
    return;
  }

  const topic = subTopicInput.value.trim();
  client.subscribe(topic, (err) => {
    if (err) {
      addMessage("Subscribe failed");
    } else {
      addMessage("Subscribed to: " + topic);
    }
  });
});

publishBtn.addEventListener("click", () => {
  if (!client) {
    addMessage("Not connected to broker");
    return;
  }

  const topic = pubTopicInput.value.trim();
  const message = messageInput.value.trim();

  client.publish(topic, message);
  addMessage(`Published to ${topic}: ${message}`);
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    addMessage("Geolocation is not supported by this browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lon = position.coords.longitude.toFixed(6);

      locationOutput.textContent = `Latitude: ${lat}, Longitude: ${lon}`;

      if (client) {
        const topic = pubTopicInput.value.trim();
        const locationMessage = JSON.stringify({ latitude: lat, longitude: lon });
        client.publish(topic, locationMessage);
        addMessage(
            `Published location to ${topic}: Latitude ${lat}, Longitude ${lon}`
        );
      } else {
        addMessage("Location fetched, but MQTT client is not connected");
      }
    },
    (error) => {
      addMessage("Geolocation error: " + error.message);
    }
  );
});