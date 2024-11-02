import dotenv from "dotenv";
import Redis from "ioredis";
dotenv.config();

const redisClient = process.env.REDIS_URL || '';

if (!redisClient) {
    throw new Error("Redis is not connected.");
}

export const redis = new Redis(redisClient);

redis.on("connect", () => {
    console.log("Redis is connected.");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});



