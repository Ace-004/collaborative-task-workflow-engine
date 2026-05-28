import Redis from "ioredis";
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const MAX_RECONNECT_RETRIES = 3;
let redisAvailable = true;
let redisConnectAttempted = false;
export const redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > MAX_RECONNECT_RETRIES) {
            console.error("Redis reconnect retries exhausted. Stopping reconnect attempts.");
            redisAvailable = false;
            return null;
        }
        // Exponential backoff capped to keep retry intervals reasonable.
        return Math.min(times * 200, 2000);
    },
});
redis.on("connect", () => console.log("Redis connected successfully."));
redis.on("error", (err) => console.error("redis connection error.", err));
redis.on("end", () => console.warn("Redis connection closed."));
const ensureRedisReady = async () => {
    if (!redisAvailable) {
        return false;
    }
    if (redis.status === "ready" || redis.status === "connecting") {
        return true;
    }
    if (redisConnectAttempted) {
        return false;
    }
    try {
        redisConnectAttempted = true;
        await redis.connect();
        return true;
    }
    catch (error) {
        redisAvailable = false;
        console.error("Redis unavailable. Caching disabled for this process.", error);
        return false;
    }
};
export const cacheSet = async (key, data, ttlSeconds = 300) => {
    try {
        if (!(await ensureRedisReady())) {
            return;
        }
        await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
    }
    catch (error) {
        console.error(`[Redis Set Error] Key: ${key}`, error);
    }
};
export const cacheGet = async (key) => {
    try {
        if (!(await ensureRedisReady())) {
            return null;
        }
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        console.error(`[Redis Get Error] Key: ${key}`, error);
        return null;
    }
};
export const cacheDelete = async (key) => {
    try {
        if (!(await ensureRedisReady())) {
            return;
        }
        await redis.del(key);
    }
    catch (error) {
        console.error(`[Redis Delete Error] Key: ${key}`, error);
    }
};
//# sourceMappingURL=redis.service.js.map