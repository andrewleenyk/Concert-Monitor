// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// — Existing REST endpoint (unchanged) —
app.use(express.json());
app.post("/sensor-data", (req, res) => {
  console.log("📥 REST Body:", req.body);
  // …your DB/Kafka logic here…
  res.status(200).send("✅ Data received");
});

// — Wrap Express in a native HTTP server —
const server = http.createServer(app);

// — Attach a WebSocket server on path "/live" —
const wss = new WebSocket.Server({ server, path: "/live" });

wss.on("connection", (ws) => {
  console.log("🔗 WS client connected");

  ws.on("message", (msg) => {
    // msg is your JSON string from the ESP32
    console.log("📥 WS message:", msg);

    // 1) Broadcast to any other WS dashboards:
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });

    // 2) (Optional) forward into Kafka/DB:
    //    kafkaProducer.send({ topic: "sensor-data", messages: [{ value: msg }] });
  });

  ws.on("close", () => console.log("❌ WS client disconnected"));
});

// — Start both HTTP & WSS on the same port —
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 HTTP + WSS listening on port ${port}`);
});
