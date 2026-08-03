// config/redis.js
const { createClient } = require('redis');

let redisClient;
const inMemoryCache = new Map();

const mockRedis = {
    async get(key) {
        return inMemoryCache.get(key) || null;
    },
    async setEx(key, ttl, value) {
        inMemoryCache.set(key, value);
    },
    async del(key) {
        inMemoryCache.delete(key);
    },
    async connect() {
        return true;
    }
};

if (process.env.REDIS_URL) {
    try {
        const client = createClient({ url: process.env.REDIS_URL });
        client.on('error', (err) => console.log('Redis Client Error:', err.message));
        client.on('connect', () => console.log('Đã kết nối thành công tới Redis!'));
        client.connect().catch(err => console.warn('Không kết nối được Redis, chuyển sang In-Memory cache:', err.message));
        redisClient = client;
    } catch (e) {
        console.warn('Lỗi khởi tạo Redis client, chuyển sang In-Memory cache:', e.message);
        redisClient = mockRedis;
    }
} else {
    console.log('⚡ Không có REDIS_URL, sử dụng In-Memory Cache cho Giỏ Hàng');
    redisClient = mockRedis;
}

module.exports = redisClient;
