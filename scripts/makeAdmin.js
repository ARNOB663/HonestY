// Promote an existing user to admin.
//   node scripts/makeAdmin.js you@example.com
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { PrismaClient } from "../lib/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: node scripts/makeAdmin.js <email>");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const lower = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: lower } });
  if (!user) {
    console.error(`No user with email ${email}. Register first at /register.`);
    process.exit(1);
  }
  await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
  console.log(`✓ ${user.email} is now admin.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
