const express = require("express");
const bodyParser = require("body-parser");
// const { Kafka } = require("kafkajs"); // Kafka disabled for now

// Load environment variables
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000; // ✅ Cloud platforms assign ports

// Middleware to parse incoming JSON
app.use(bodyParser.json());

// ---- Kafka Setup (Commented Out) ----
// const kafka = new Kafka({
//   clientId: process.env.KAFKA_CLIENT_ID || "esp32-producer",
//   brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
// });
// const producer = kafka.producer();

// const runProducer = async () => {
//   await producer.connect();
//   console.log("✅ Kafka producer connected");
// };

// runProducer().catch(console.error);

// ---- Endpoint for ESP32 Sensor Data ----
app.post("/sensor-data", async (req, res) => {
  const data = req.body;
  console.log("📥 Received from ESP32:", data);

  try {
    // Future: send to Kafka
    // await producer.send({
    //   topic: process.env.KAFKA_TOPIC || "sensor-data",
    //   messages: [{ value: JSON.stringify(data) }],
    // });

    res.status(200).send("✅ Data received"); // ✅ basic success
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).send("Server error");
  }
});

// ---- Start the Server ----
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});
