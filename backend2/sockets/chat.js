// sockets/chat.js
const Message = require('../models/message');

function initChat(io) {
  io.on('connection', async (socket) => {
    const session = socket.request.session;

    if (!session || !session.username) {
      socket.emit('auth-required');
      return socket.disconnect(true);
    }

    const username = session.username;
    socket.data.name = username;

    console.log(`${username} connected`);

    // 發送歷史訊息
    try {
      const history = await Message.getFromRedis();
      socket.emit('history', history);
    } catch (err) {
      console.error('Send history error:', err);
    }


    
    // 接收訊息
    socket.on('chat-message', async (text) => {
      if (!socket.request.session || !socket.request.session.username) {
        socket.emit('auth-required');
        return socket.disconnect(true);
      }
      const message = { sender: username, text, time: new Date() };
      await Message.pushToRedis(message);
    });

    // 使用者登出
    socket.on('user-logout', async () => {
      const leaveMsg = { sender: 'system', text: `${username} 離開聊天室`, time: new Date() };
      await Message.pushToRedis(leaveMsg);
      console.log(`${username} logged out`);
    });
  });
}

module.exports = initChat;
