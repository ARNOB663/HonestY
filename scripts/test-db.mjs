import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: ".env.local" });

const uri = "mongodb://arnob229x:01811671165@ac-ypbi8tw-shard-00-00.jlbxmqr.mongodb.net:27017,ac-ypbi8tw-shard-00-01.jlbxmqr.mongodb.net:27017,ac-ypbi8tw-shard-00-02.jlbxmqr.mongodb.net:27017/honesty?ssl=true&replicaSet=atlas-miav9o-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

console.log("Connecting (non-SRV)…");
const start = Date.now();
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✓ Connected in ${Date.now() - start}ms`);
  console.log("Database name:", mongoose.connection.name);
  console.log("Host:", mongoose.connection.host);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map((c) => c.name));
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${count} documents`);
  }
  await mongoose.disconnect();
  console.log("✓ Disconnected cleanly");
} catch (e) {
  console.error("✗ Connection failed:", e.message);
  if (e.cause) console.error("  Cause:", e.cause.message);
  process.exit(1);
}
