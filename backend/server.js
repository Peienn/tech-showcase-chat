const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' } // 允許所有來源
});

const PORT = 3000;

// 記憶體存訊息
let messages = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 連線後發送歷史訊息
  socket.emit('chat-message', messages);

  // 使用者 join
  socket.on('join', (name) => {
    socket.data.name = name; // 綁定 socket 名稱
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
