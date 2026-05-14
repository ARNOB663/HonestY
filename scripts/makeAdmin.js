// Promote an existing user to admin.
//   node scripts/makeAdmin.js you@example.com
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import mongoose from "mongoose";
import User from "../models/User.js";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: node scripts/makeAdmin.js <email>");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: "admin" },
    { new: true }
  );
  if (!user) {
    console.error(`No user with email ${email}. Register first at /register.`);
    process.exit(1);
  }
  console.log(`✓ ${user.email} is now admin.`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
