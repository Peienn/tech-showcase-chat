const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:8080$/  // 允許所有 192.168.x.x
    ],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

const PORT = 3001;

// ------------------------
// Redis 客戶端
// ------------------------
const redis = createClient({ socket: { host: "192.168.0.101", port: 6379 } });
const redisSub = createClient({ socket: { host: "192.168.0.101", port: 6379 } });

redis.on("error", (err) => console.log("Redis Error:", err));
redisSub.on("error", (err) => console.log("RedisSub Error:", err));

(async () => {
  await redis.connect();
  await redisSub.connect();
  console.log("Redis connected!", await redis.ping());

  // 訂閱頻道
  await redisSub.subscribe("chat-channel", (messageJson) => {
    const msg = JSON.parse(messageJson);
    io.emit("chat-message", msg); // 同步給這台 server 的所有使用者
  });
})();

// ------------------------
// Helper: Push + Trim + Publish
// ------------------------
async function pushMessageToRedis(message) {
  const json = JSON.stringify(message);
  await redis.rPush("chat:messages", json);
  await redis.lTrim("chat:messages", -50, -1);
  await redis.publish("chat-channel", json);
}

// ------------------------
// Socket.IO 主邏輯
// ------------------------
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 使用者 join
  socket.on('join', async (name) => {
    socket.data.name = name;

    // 讀 Redis 最新 50 條訊息
    const raw = await redis.lRange("chat:messages", 0, -1);
    const history = raw.map(item => JSON.parse(item));

    // 建立 join 訊息
    const joinMsg = {
      sender: 'system',
      text: `${name} 已加入聊天室`,
      time: new Date()
    };

    // 先推到 Redis，但不 publish 給自己
      await redis.rPush("chat:messages", JSON.stringify(joinMsg));
      await redis.lTrim("chat:messages", -50, -1);

    // 新使用者看到歷史 + join 訊息
    socket.emit('history', [...history, joinMsg]);

    console.log(name, "joined");
  });

  // 接收使用者訊息
  socket.on('chat-message', async (text) => {
    const message = {
      sender: socket.data.name || 'unknown',
      text,
      time: new Date()
    };
    await pushMessageToRedis(message);
  });

  // 使用者離開
  socket.on('disconnect', async () => {
    if (socket.data.name) {
      const leaveMsg = {
        sender: 'system',
        text: `${socket.data.name} 離開聊天室`,
        time: new Date()
      };
      await pushMessageToRedis(leaveMsg);
      console.log(socket.data.name, 'disconnected');
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
