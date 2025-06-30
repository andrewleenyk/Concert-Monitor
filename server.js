const express = require("express");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.post("/sensor-data", (req, res) => {
  console.log("📥 REST Body:", req.body);
  res.status(200).send("✅ Data received");
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/live" });

wss.on("connection", (ws) => {
  console.log("🔗 WS client connected");

  ws.on("message", (data) => {
    const msg = data.toString();
    console.log("📥 WS message:", msg);
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on("close", () => console.log("❌ WS client disconnected"));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 HTTP + WSS listening on port ${port}`);
});
