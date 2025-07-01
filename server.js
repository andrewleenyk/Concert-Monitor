// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { MongoClient } = require("mongodb");
const client = require("prom-client");
require("dotenv").config();

// —— Prometheus setup (unchanged) ——
client.collectDefaultMetrics();
// … your existing gauges/counters/histograms …

// —— MongoDB setup ——
const mongo = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let sensorCollection;

(async () => {
  await mongo.connect();
  sensorCollection = mongo.db("sensors").collection("readings");
  console.log("✅ MongoDB connected");
})().catch((err) => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// —— HTTP sensor endpoint ——
app.post("/sensor-data", async (req, res) => {
  const timer = sensorDataDuration.startTimer();
  try {
    const reading = {
      ...req.body,
      ts: new Date(),
    };

    // 1) Prometheus metric
    sensorDataTotal.inc();

    // 2) Kafka produce (if you’re using Kafka)
    await producer.send({
      topic: "sensor-data",
      messages: [{ value: JSON.stringify(reading) }],
    });

    // 3) MongoDB persist
    await sensorCollection.insertOne(reading);

    res.status(200).json({ status: "success" });
  } catch (err) {
    console.error("❌ failed to handle /sensor-data:", err);
    res.status(500).json({ status: "error" });
  } finally {
    timer();
  }
});

// —— Metrics endpoint ——
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// —— Health check ——
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/live" });

wss.on("connection", (ws) => {
  wsActiveConns.inc();

  ws.on("message", async (data) => {
    const msg = JSON.parse(data.toString());
    const reading = { ...msg, ts: new Date() };

    // 1) Prometheus
    wsMessagesTotal.inc();

    // 2) Kafka produce
    await producer.send({
      topic: "sensor-data",
      messages: [{ value: JSON.stringify(reading) }],
    });

    // 3) MongoDB persist
    await sensorCollection.insertOne(reading);

    // 4) Broadcast live to other WS clients
    const payload = JSON.stringify(reading);
    wss.clients.forEach((c) => {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(payload);
      }
    });
  });

  ws.on("close", () => wsActiveConns.dec());
  ws.on("error", () => wsActiveConns.dec());
});

(async () => {
  // connect Kafka…
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: "sensor-data" });
  // and consumer.run(…) to re‑broadcast from Kafka if you’re using that path
})();

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 listening on port ${port}`);
  console.log(`📊 metrics at http://localhost:${port}/metrics`);
});
