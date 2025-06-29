const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log("📨 Incoming Request:");
  console.log("➡️ Method:", req.method);
  console.log("➡️ URL:", req.url);
  console.log("➡️ Headers:", req.headers);
  next();
});

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Invalid JSON received:", err.message);
    return res.status(400).send("Invalid JSON");
  }
  next();
});

app.post("/sensor-data", async (req, res) => {
  const data = req.body;

  console.log("📥 Parsed Body:", JSON.stringify(data, null, 2));

  if (!data || typeof data !== "object") {
    console.error("❌ Missing or invalid body");
    return res.status(400).send("Invalid or missing JSON body");
  }

  res.status(200).send("✅ Data received");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});
