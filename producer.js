// producer.js (ES Module style)

import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { Kafka, Partitioners } from "kafkajs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Kafka setup
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "serial-producer",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

// Serial port setup (⚠️ make sure this matches your actual ESP32 port)
const portPath = process.env.SERIAL_PORT_PATH || "/dev/tty.usbserial-0001"; // Use environment variable
const baudRate = parseInt(process.env.SERIAL_BAUD_RATE) || 115200;

const port = new SerialPort({
  path: portPath,
  baudRate: baudRate,
  autoOpen: false, // We'll open manually to catch errors
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

// Main function
const run = async () => {
  try {
    await producer.connect();
    console.log("✅ Kafka producer connected");

    port.open((err) => {
      if (err) {
        console.error(
          `❌ Failed to open serial port (${portPath}):`,
          err.message
        );
        process.exit(1);
      }
      console.log(`📡 Serial port ${portPath} opened`);
    });

    parser.on("data", async (line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      console.log("🔌 Serial:", cleanLine);

      try {
        await producer.send({
          topic: process.env.KAFKA_TOPIC || "sensor-data",
          messages: [{ value: cleanLine }],
        });
      } catch (err) {
        console.error("❌ Kafka send failed:", err);
      }
    });
  } catch (err) {
    console.error("❌ Error initializing producer:", err);
    process.exit(1);
  }
};

run();
