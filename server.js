const express = require("express");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// ————— Express middleware & REST endpoint —————
app.use((req, res, next) => {
  console.log("📨", req.method, req.url);
  next();
});

app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    console.error("❌ Invalid JSON:", err.message);
    return res.status(400).send("Invalid JSON");
  }
  next();
});

app.post("/sensor-data", (req, res) => {
  console.log("📥 REST Body:", req.body);
  // …your DB/Kafka logic here…
  res.status(200).send("✅ Data received");
});

// ————— WebSocket server alongside Express —————
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/live" });

wss.on("connection", (ws) => {
  console.log("🔗 WS client connected");

  ws.on("message", (msg) => {
    console.log("📥 WS message:", msg);
    // broadcast to all other WS clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
    // …or forward to Kafka/DB here…
  });

  ws.on("close", () => console.log("❌ WS client disconnected"));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 HTTP+WS listening on port ${port}`);
});
