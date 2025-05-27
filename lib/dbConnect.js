import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Routedst hot reloading.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    // console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering if you handle connection errors properly
    };

    // console.log('Creating new MongoDB connection');
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        // console.log('MongoDB connected successfully!');
        return mongooseInstance;
      });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on error
    console.error("MongoDB connection error in dbConnect:", e);
    throw e; // Re-throw error to be caught by API route
  }
  return cached.conn;
}

export default dbConnect;
