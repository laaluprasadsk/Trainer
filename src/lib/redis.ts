import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL || "", {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

/**
 * Acquires a 10-minute atomic lock on an availability slot
 */
export async function acquireSlotLock(slotId: string, clientId: string): Promise<boolean> {
  try {
    const key = `slot_lock:${slotId}`;
    const result = await redis.set(key, clientId, "PX", 600000, "NX"); // 10 min TTL
    return result === "OK";
  } catch (error) {
    console.error("Redis Lock Warning:", error);
    return true; // Fallback for local development
  }
}