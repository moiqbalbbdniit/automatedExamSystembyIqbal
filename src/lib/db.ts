import mongoose from "mongoose";

import "@/lib/models/Exam";
import "@/lib/models/Submission";
import "@/lib/models/faculty"; // ✅ always lowercase if filename is lowercase
import "@/lib/models/subject"; // ✅ always lowercase if filename is lowercase
import "@/lib/models/User";
const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env file");
}

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
};
