// 1. Node 內建或第三方套件
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const cookieParser = require('cookie-parser');

// 2. 自訂模組
const config = require('./config');
const { connectRedis ,redis, redisSub, redisSession, } = require('./db');
const Message = require('./models/message');


// 3. 建立 Express app
const app = express();
// 掛載前置 middleware 
app.use(cookieParser());
app.use(express.json());

// 4. 建立 session middleware
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
//  掛載 session middleware 到 Express ，
//  這樣每個HTTP 請求都會經過session middleware
//  session middleware會讀 cookie → 取得 session ID → 到 Redis 拿 session 資料 → 塞回 req.session (Socket也是)
app.use(sessionMiddleware);



// 5. 建立 HTTP server ，並將收到的HTTP Request轉給app (request handler)
const server = http.createServer(app);
// 最終形成流程總結 (HTTP 請求 - Express 路由)：
// 1. server (http.createServer) 接收 HTTP 請求。
// 2. 請求傳給 app (request handler)。
// 3. 請求依序經過 Express Middleware (如 cookieParser → express.json → sessionMiddleware)。
// 4. sessionMiddleware 處理 Session 並將結果存入 req.session。
// 5. 請求到達後端 Route handler，此時 Route handler 可以安全存取 req.session。


// 6. 建立 Socket.IO 並整合 session
// Socket IO 依附在HTTP Server上，才能處理連線
const io = new Server(server, {
  cors: config.cors,
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

//把 io 存到 app.locals
app.locals.io = io;

// io.engine.use() 會將 session middleware 掛載到 Socket.IO 連線上
// ★★★★★ 重點：將 sessionMiddleware 加到握手階段
io.engine.use(sessionMiddleware);
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

//// 6. Redis 訂閱
connectRedis(io);



// ------------------------
// HTTP API 路由
// ------------------------
const authRouter = require('./routes/auth');
const messageRouter = require('./routes/message');
const webhookRouter = require('./routes/webhook');

app.use('/', authRouter); 
app.use('/api/message', messageRouter); 
app.use('/api/webhook', webhookRouter); 



// ------------------------
// Socket IO
// ------------------------
const initChat = require('./sockets/chat');
initChat(io);



const PORT = 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});