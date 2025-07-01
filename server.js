const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const client = require("prom-client");
require("dotenv").config();

client.collectDefaultMetrics();

const wsActiveConns = new client.Gauge({
  name: "ws_active_connections",
  help: "Number of active WebSocket connections",
});

const wsMessagesTotal = new client.Counter({
  name: "ws_messages_total",
  help: "Total number of WebSocket messages received",
});

const sensorDataTotal = new client.Counter({
  name: "sensor_data_total",
  help: "Total number of sensor data requests received",
});

const sensorDataDuration = new client.Histogram({
  name: "sensor_data_duration_seconds",
  help: "Duration of sensor data processing in seconds",
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const app = express();
const port = process.env.PORT || 3000;

// Mmiddleware to parse JSON
app.use(express.json());

// middleware to track HTTP requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    });
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path },
      duration
    );
  });

  next();
});

// health check endpoint
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

// prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    console.error("Error generating metrics:", error);
    res.status(500).send("Error generating metrics");
  }
});

app.post("/sensor-data", async (req, res) => {
  const timer = sensorDataDuration.startTimer();

  try {
    console.log("📥 Received sensor data:", req.body);
    sensorDataTotal.inc();

    // Process sensor data here
    // await processSensorData(req.body);

    res.status(200).json({
      status: "success",
      message: "Data received",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error processing sensor data:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to process sensor data",
    });
  } finally {
    timer();
  }
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server, path: "/live" });

wss.on("connection", (ws, req) => {
  wsActiveConns.inc();
  console.log("🔌 WebSocket client connected from:", req.socket.remoteAddress);

  ws.on("message", (data) => {
    wsMessagesTotal.inc();

    try {
      const msg = data.toString();
      console.log("📨 WebSocket message received:", msg);

      // Broadcast to all other connected clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    } catch (error) {
      console.error("❌ Error processing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    wsActiveConns.dec();
    console.log("🔌 WebSocket client disconnected");
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
    wsActiveConns.dec();
  });
});

// graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

// Start the server
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/metrics`);
  console.log(`❤️  Health check at http://localhost:${port}/health`);
  console.log(`🔌 WebSocket endpoint at ws://localhost:${port}/live`);
});
