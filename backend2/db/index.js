const { createClient } = require('redis');
const { Pool } = require('pg');
const config = require('../config');

// ------------------------
// Redis 客戶端
// ------------------------
const redis = createClient({ socket: config.redis });
const redisSub = createClient({ socket: config.redis });
const redisSession = createClient({ socket: config.redis });

redis.on('error', (err) => console.log('Redis Error:', err));
redisSub.on('error', (err) => console.log('RedisSub Error:', err));
redisSession.on('error', (err) => console.log('RedisSession Error:', err));

// ------------------------
// PostgreSQL 連線池
// ------------------------
const db = new Pool(config.postgresql);

db.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

// ------------------------
// 初始化連線
// ------------------------
async function initializeConnections() {
  try {
    // Redis 連線
    await redis.connect();
    await redisSub.connect();
    await redisSession.connect();
    console.log('✅ Redis connected!', await redis.ping());

    await redisSub.subscribe("chat-channel", (messageJson) => {
        const msg = JSON.parse(messageJson);
        io.emit("chat-message", msg);
      });
    console.log('✅ Redis subscribe  chat-channel !');

    // PostgreSQL 連線
    const client = await db.connect();
    console.log('✅ PostgreSQL connected!');
    client.release();

    return { redis, redisSub, redisSession, db };
  } catch (err) {
    console.error('❌ Connection error:', err);
    process.exit(1);
  }
}

// ------------------------
// 優雅關閉
// ------------------------
async function closeConnections() {
  console.log('Closing database connections...');
  
  try {
    await redis.quit();
    await redisSub.quit();
    await redisSession.quit();
    await db.end();
    console.log('✅ All connections closed');
  } catch (err) {
    console.error('❌ Error closing connections:', err);
  }
}

module.exports = {
  redis,
  redisSub,
  redisSession,
  db,
  initializeConnections,
  closeConnections,
};