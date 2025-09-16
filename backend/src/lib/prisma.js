// backend/src/lib/prisma.js
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances in dev (nodemon / hot reload)
const globalForPrisma = globalThis;
const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

export { prisma };          // 👈 add named export
export default prisma; 