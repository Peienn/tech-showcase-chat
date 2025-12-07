const { createClient } = require('redis');
const { Pool } = require('pg');

// 自定義 config
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

// 連線並且訂閱頻道
const channel = "chat-channel"

async function connectRedis(io) {
  await redis.connect();
  await redisSub.connect();
  await redisSession.connect();
  console.log("Redis connected!", await redis.ping());

  // 訂閱頻道
  if (io) {
    await redisSub.subscribe( channel , (messageJson) => {
      const msg = JSON.parse(messageJson);
      io.emit("chat-message", msg);
      });
  }
}



// ------------------------
// PostgreSQL 連線池
// ------------------------
const postgre = new Pool(config.postgresql);
postgre.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});


module.exports = {
  redis,
  redisSub,
  redisSession,
  postgre,
  connectRedis
};