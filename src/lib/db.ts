import mongoose from "mongoose";

import "@/lib/models/Exam";
import "@/lib/models/Submission";
import "@/lib/models/faculty"; // ✅ always lowercase if filename is lowercase
import "@/lib/models/subject"; // ✅ always lowercase if filename is lowercase
import "@/lib/models/User";
const MONGODB_URI = process.env.MONGODB_URI || "";

// Fail fast instead of buffering model ops when DB is unreachable.
mongoose.set("bufferCommands", false);

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env file");
}

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    isConnected = false;
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
};
