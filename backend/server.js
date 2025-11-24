const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

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

const PORT = 3000;



/*
// --- Redis 測試 ---
const { createClient } = require('redis');
const redis = createClient({
  socket: { host: "192.168.0.101", port: 6379 }
});

redis.on("error", (err) => console.log("Redis Error:", err));
redis.on("connect", () => console.log("Redis connected!"));

(async () => {
  await redis.connect();
  console.log("Ping:", await redis.ping());
})();
// --- End Redis 測試 ---
*/

// 記憶體存訊息
let messages = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 連線後發送歷史訊息
  

  // 使用者 join
  socket.on('join', (name) => {
    socket.data.name = name; // 綁定 socket 名稱
    socket.emit('history', messages);
    console.log(socket.data.name , 'Connect');
    const joinMsg = { sender: 'system', text: `${name} 已加入聊天室` };
    messages.push(joinMsg);
    io.emit('chat-message', joinMsg);
  });

  // 接收訊息
  socket.on('chat-message', (text) => {
    const message = {
      sender: socket.data.name || 'unknown',
      text,
      time: new Date()
    };
    
    messages.push(message);
    console.log("Now, history messages were : ",messages)
    io.emit('chat-message', message);
  });

  // 使用者離開
  socket.on('disconnect', () => {
    if (socket.data.name) {
      console.log(socket.data.name , 'disconnected');
      const leaveMsg = { sender: 'system', text: `${socket.data.name} 離開聊天室` };
      messages.push(leaveMsg);
      io.emit('chat-message', leaveMsg);
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
