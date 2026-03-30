# ENGO651 / S51 - Lab 5

## Overview
This project is a web-based MQTT client built with HTML, CSS, and JavaScript. It connects to an MQTT broker over WebSockets, allows users to publish and subscribe to topics, and shares location and temperature data using GeoJSON. The application also displays the received temperature data on a Leaflet map.

## Live Demo
https://asad2025.github.io/Project5_ENGG551/

## Features
- Connect to an MQTT broker using a user-defined host and port
- Start and end broker connection
- Automatic reconnection on connection loss
- Subscribe to custom topics
- Publish messages to any topic
- Share current status using GeoJSON
- Generate a random temperature value
- Display temperature data on a Leaflet map
- Update the map automatically from subscribed MQTT messages
- Change marker color based on temperature range

## Technologies Used
- HTML
- CSS
- JavaScript
- MQTT.js
- Leaflet.js
- OpenStreetMap
- Mosquitto public broker

## Topic Format
The required temperature topic is:

`engo651/asad_haider/my_temperature`

## How to Use

### 1. Connect to the broker
- Enter the broker host in the **Host** field  
- Enter the broker port in the **Port** field  
- Optionally enter a custom **Client ID**
- Click **Start**

By default, the app uses:
- Host: `test.mosquitto.org`
- Port: `8081`

### 2. End the connection
- Click **End** to disconnect from the broker

### 3. Subscribe to a topic
You can subscribe in two ways:

#### Custom topic
- Enter any topic in the **Custom Subscribe Topic** field
- Click **Subscribe**

#### Temperature topic
- Use the required topic in the **My Temperature Topic** field
- Click **Subscribe to Temperature Topic**

### 4. Publish a message
- Enter a topic in the **Publish Topic** field
- Enter a message in the **Message** field
- Click **Publish**

### 5. Share your status
- Click **Share My Status**
- The app gets your current location
- A random temperature value is generated
- A GeoJSON message is created and published to the temperature topic
- The location and temperature are displayed on the map

### 6. View map updates
- The Leaflet map updates automatically when a valid GeoJSON temperature message is received on the subscribed temperature topic
- Click the marker to see the temperature in a popup

## Marker Color Rules
- Blue: temperature from -40 to 10 °C
- Green: temperature from 10 to 30 °C
- Red: temperature from 30 to 60 °C

## Example GeoJSON Payload
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-114.0719, 51.0447]
  },
  "properties": {
    "temperature": 24
  }
}