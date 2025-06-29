const { Kafka } = require("kafkajs");

// Load environment variables
require("dotenv").config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "sensor-consumer",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

const consumer = kafka.consumer({ groupId: "sensor-group" });

const run = async () => {
  try {
    await consumer.connect();
    console.log("✅ Connected to Kafka");

    await consumer.subscribe({
      topic: process.env.KAFKA_TOPIC || "sensor-data",
      fromBeginning: false,
    });
    console.log(
      "📡 Subscribed to topic:",
      process.env.KAFKA_TOPIC || "sensor-data"
    );

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value.toString();
        console.log(`📥 [${topic}] Partition ${partition}: ${value}`);
      },
    });
  } catch (err) {
    console.error("❌ Consumer error:", err);
  }
};

run();
