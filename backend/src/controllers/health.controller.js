import { prisma } from "../lib/prisma.js";

export async function healthCheck(req, res) {
  // optional DB ping (safe & quick)
  await prisma.$queryRaw`SELECT 1`;
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    db: "reachable",
  });
}
