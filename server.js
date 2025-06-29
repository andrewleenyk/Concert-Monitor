const express = require("express");
const bodyParser = require("body-parser");
// const { Kafka } = require("kafkajs");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // Handles JSON payloads

// 👇 Add this to catch invalid JSON (e.g. from ESP32 if malformed)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Invalid JSON received:", err.message);
    return res.status(400).send("Invalid JSON");
  }
  next();
});

// ---- POST /sensor-data ----
app.post("/sensor-data", async (req, res) => {
  const data = req.body;

  // 👀 Logging + sanity check
  console.log("📥 Headers:", req.headers);
  console.log("📥 Raw Body:", data);

  if (!data || typeof data !== "object") {
    console.error("❌ Missing or invalid body");
    return res.status(400).send("Invalid or missing JSON body");
  }

  // Future: Kafka send here
  res.status(200).send("✅ Data received");
});

// ---- Start Server ----
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});
