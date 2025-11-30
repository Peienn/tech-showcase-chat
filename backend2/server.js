const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);

const PORT = 3001;

// ------------------------
// Redis 客戶端
// ------------------------
const redis = createClient({ socket: { host: "192.168.0.101", port: 6379 } });
const redisSub = createClient({ socket: { host: "192.168.0.101", port: 6379 } });
const redisSession = createClient({ socket: { host: "192.168.0.101", port: 6379 } });

redis.on("error", (err) => console.log("Redis Error:", err));
redisSub.on("error", (err) => console.log("RedisSub Error:", err));
redisSession.on("error", (err) => console.log("RedisSession Error:", err));

(async () => {
  await redis.connect();
  await redisSub.connect();
  await redisSession.connect();
  console.log("Redis connected!", await redis.ping());

  // 訂閱頻道
  await redisSub.subscribe("chat-channel", (messageJson) => {
    const msg = JSON.parse(messageJson);
    io.emit("chat-message", msg);
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
// Session 設定
// ------------------------


const sessionMiddleware = session({
  store: new RedisStore({ client: redisSession }),
  secret: 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'chatroom.sid',
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
    sameSite: 'lax'
  }
});
app.use(cookieParser());
app.use(express.json());
app.use(sessionMiddleware);
// ------------------------
// Socket.IO 設定
// ------------------------
const io = new Server(server, {
  cors: { 
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:8080$/
    ],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// 將 express session 整合到 Socket.IO
io.engine.use(sessionMiddleware);





// ------------------------
// HTTP API 路由
// ------------------------
// 登入 API
app.post('/login', async (req, res) => {
  const { username } = req.body;
  
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: '請輸入使用者名稱' });
  }

  const trimmedUsername = username.trim();
  const isNewLogin = !req.session.username; // 判斷是否為新登入

  // 儲存使用者資訊到 session
  req.session.username = trimmedUsername;
  req.session.save(async (err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ error: '登入失敗' });
    }

    // 只有新登入時才發送加入訊息
    if (isNewLogin) {
      const joinMsg = {
        sender: 'system',
        text: `${trimmedUsername} 已加入聊天室`,
        time: new Date()
      };
      await pushMessageToRedis(joinMsg);
    }

    res.json({ 
      success: true, 
      username: req.session.username 
    });
  });
});

// 登出 API
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '登出失敗' });
    }
    res.clearCookie('chatroom.sid');
    res.json({ success: true });
  });
});

// 檢查登入狀態 API
app.get('/check-session', (req, res) => {
  if (req.session.username) {
    res.json({ 
      loggedIn: true, 
      username: req.session.username 
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// ------------------------
// Socket.IO 主邏輯
// ------------------------
io.on('connection', (socket) => {

      // 連線的socket中找session
      const session = socket.request.session;
      // 檢查是否已登入，沒有就直接Return
      if (!session || !session.username) {
        console.log('User not logged in, disconnecting:', socket.id);
        socket.emit('auth-required');
        socket.disconnect(true);
        return;
      }
      // 有Session的話找出名稱
      const username = session.username;
      socket.data.name = username;
      console.log(`${username} connected with session`);

      (async () => {
        // 讀取歷史訊息
        const raw = await redis.lRange("chat:messages", 0, -1);
        const history = raw.map(item => JSON.parse(item));
        // 發送歷史訊息給使用者
        socket.emit('history', [...history]);
      })();



      // 接收使用者訊息
      socket.on('chat-message', async (text) => {
        // 再次驗證 session（防止 session 過期）
        if (!socket.request.session || !socket.request.session.username) {
          socket.emit('auth-required');
          socket.disconnect(true);
          return;
        }

        //組合訊息
        const message = {
          sender: username,
          text,
          time: new Date()
        };
        //儲存到redis
        await pushMessageToRedis(message);
      });

      // 使用者登出
      socket.on('user-logout', async () => {

        //組合訊息
        const leaveMsg = {
          sender: 'system',
          text: `${username} 離開聊天室`,
          time: new Date()
        };
        //儲存到redis
        await pushMessageToRedis(leaveMsg);
        console.log(username, 'logged out');
      });

  
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});