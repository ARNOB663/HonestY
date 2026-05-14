// Quick connectivity check for Cloudinary.
//   node scripts/checkCloudinary.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { v2 as cloudinary } from "cloudinary";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

console.log("[cloudinary] env check");
console.log("  CLOUDINARY_CLOUD_NAME :", CLOUDINARY_CLOUD_NAME ? (CLOUDINARY_CLOUD_NAME === "REPLACE_ME" ? "REPLACE_ME (not set)" : CLOUDINARY_CLOUD_NAME) : "missing");
console.log("  CLOUDINARY_API_KEY    :", CLOUDINARY_API_KEY ? `${CLOUDINARY_API_KEY.slice(0, 4)}…${CLOUDINARY_API_KEY.slice(-3)}` : "missing");
console.log("  CLOUDINARY_API_SECRET :", CLOUDINARY_API_SECRET ? `${CLOUDINARY_API_SECRET.slice(0, 4)}…${CLOUDINARY_API_SECRET.slice(-3)}` : "missing");

if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === "REPLACE_ME" || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.log("\n✗ Not configured. Fill in CLOUDINARY_CLOUD_NAME in .env.local.");
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

try {
  const ping = await cloudinary.api.ping();
  console.log("\n✓ Ping:", ping);
  const usage = await cloudinary.api.usage();
  console.log("  Plan:", usage.plan, "| Credits used:", usage.credits?.usage ?? "n/a");
  console.log("  Storage:", usage.storage?.usage ?? "n/a", "bytes");
  console.log("\n✓ Cloudinary is working.");
} catch (e) {
  console.log("\n✗ Failed:", e.message || e);
  if (e.error?.message) console.log("  Detail:", e.error.message);
  if (String(e.message || "").toLowerCase().includes("not found")) {
    console.log("  Hint: the cloud name in CLOUDINARY_CLOUD_NAME is wrong.");
  }
  if (String(e.message || "").toLowerCase().includes("invalid signature") || String(e.message || "").toLowerCase().includes("api_key")) {
    console.log("  Hint: the API key or secret is wrong — re-copy them from the Cloudinary dashboard.");
  }
  process.exit(1);
}
