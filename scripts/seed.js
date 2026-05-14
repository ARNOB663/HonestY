// Run with:  node scripts/seed.js
// Requires MONGODB_URI in .env.local
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // also load .env if present
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { products } from "../data/products.js";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  console.log("Connected. Wiping products…");
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Inserted ${products.length} products.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
