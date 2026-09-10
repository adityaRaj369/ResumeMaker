import { prisma } from "@/lib/prisma";

/** Sliding-window rate limit stored in DB (works across serverless instances sharing the same DB). */
export async function enforceRateLimit(
  key: string,
  limit = Number(process.env.AI_RATE_LIMIT_PER_HOUR || 20),
  windowHours = 1,
) {
  const now = new Date();
  const windowMs = windowHours * 60 * 60 * 1000;
  const windowStartCutoff = new Date(now.getTime() - windowMs);
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowStart < windowStartCutoff) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, windowStart: now },
      create: { key, count: 1, windowStart: now },
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { allowed: true, remaining: limit - existing.count - 1 };
}
