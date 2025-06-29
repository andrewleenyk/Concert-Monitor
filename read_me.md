# ConcertMonitor

A Node.js application for monitoring concert sensor data using Kafka and Express.

## Security Setup

Before running the application, create a `.env` file with your configuration:

```bash
cp env.example .env
```

Then edit `.env` with your actual values:

```env
# Server Configuration
PORT=3000

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=esp32-producer
KAFKA_TOPIC=sensor-data

# Serial Port Configuration (for producer.js)
SERIAL_PORT_PATH=/dev/tty.usbserial-0001
SERIAL_BAUD_RATE=115200

# MongoDB Configuration (if needed in the future)
MONGODB_URI=mongodb://localhost:27017/concertmonitor

# Security (add your own secret keys)
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here
```

## Installation

```bash
npm install
```

## Usage

### Start Kafka Broker

```bash
bin/kafka-server-start.sh config/kraft-broker.properties
```

### Start the Server/Producer

```bash
node server.js
```

### Start a Consumer

```bash
node consumer.js
```

### Start Serial Port Producer

```bash
node producer.js
```

## Development Commands

### Clear Kafka Storage (for testing)

```bash
rm -rf /tmp/kafka-logs/
rm -rf /tmp/kraft-combined-logs/
```

## Security Notes

- Never commit `.env` files to version control
- The `.gitignore` file excludes sensitive files and directories
- All configuration is now environment-based for security
- Backup files and copies are automatically excluded
