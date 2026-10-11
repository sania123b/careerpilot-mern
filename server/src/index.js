import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
const {
  MONGODB_URI,
  PORT = 5000,
  CLIENT_ORIGIN = "http://localhost:5173",
} = process.env;
if (!MONGODB_URI) {
  console.error(
    "MONGODB_URI is required. Copy .env.example to .env and set your database URL.",
  );
  process.exit(1);
}
try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  createApp({ clientOrigin: CLIENT_ORIGIN }).listen(PORT, () =>
    console.log(`CareerPilot API listening on port ${PORT}`),
  );
} catch (error) {
  console.error("Could not connect to MongoDB:", error.message);
  process.exit(1);
}
