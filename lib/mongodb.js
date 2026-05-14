import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const isProd = process.env.NODE_ENV === "production";

if (!MONGODB_URI && !isProd) {
  console.warn("[mongodb] MONGODB_URI not set — DB calls will fail until you add it to .env.local");
}

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      })
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
