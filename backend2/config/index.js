module.exports = {
  server: {
    port: process.env.PORT || 3000,
  },

  redis: {
    host: process.env.REDIS_HOST || '192.168.0.101',
    port: process.env.REDIS_PORT || 6379,
  },

  postgresql: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ChatRoom',
    user: process.env.DB_USER || 'chat_user',
    password: process.env.DB_PASSWORD || 'chat_user',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    name: 'chatroom.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
      sameSite: 'lax',
    },
  },

  cors: {
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:8080$/,
    ],
    credentials: true,
  },
};