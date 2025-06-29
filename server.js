const express = require("express");
// const { Kafka } = require("kafkajs");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Use built-in Express JSON parser (recommended over body-parser)
app.use(express.json());

// 🛑 Catch malformed JSON bodies
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Invalid JSON received:", err.message);
    return res.status(400).send("Invalid JSON");
  }
  next();
});

// 🚨 POST endpoint for ESP32 data
app.post("/sensor-data", async (req, res) => {
  const data = req.body;

  // 🧠 Log incoming headers and data
  console.log("📥 Headers:", req.headers);
  console.log("📥 Raw Body:", data);

  // 🚫 Validate body
  if (!data || typeof data !== "object") {
    console.error("❌ Missing or invalid body");
    return res.status(400).send("Invalid or missing JSON body");
  }

  // ✅ Handle successfully
  res.status(200).send("✅ Data received");
});

// 🚀 Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});
