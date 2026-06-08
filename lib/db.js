// Prisma client singleton. One connection pool is shared across hot reloads
// in dev and across the persistent Node process in production.

import { PrismaClient } from "./generated/prisma/client.js";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma__ = prisma;
}

// Back-compat shim — Prisma manages connections lazily.
export async function dbConnect() {
  return prisma;
}

export default prisma;
