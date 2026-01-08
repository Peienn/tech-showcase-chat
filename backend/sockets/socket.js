// sockets/socket.js
let io;

module.exports = {
  init: (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: '*',
        credentials: true
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
  }
};
