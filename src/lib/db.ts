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

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache || { conn: null, promise: null };

if (!global._mongooseCache) {
  global._mongooseCache = cache;
}

export const connectDB = async () => {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  try {
    if (!cache.promise) {
      cache.promise = mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
    }

    cache.conn = await cache.promise;
    console.log("✅ MongoDB Connected");
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
};
