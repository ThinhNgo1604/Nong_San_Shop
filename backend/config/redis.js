// config/redis.js
const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Đã kết nối thành công tới Redis!'));

// Kết nối ngay khi khởi động
redisClient.connect();

module.exports = redisClient;