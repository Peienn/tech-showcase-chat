const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');
const { redis } = require('../db');




// 登入 API
router.post('/login', async (req, res) => {
  const { username } = req.body;
  
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: '請輸入使用者名稱' });
  }


  const trimmedUsername = username.trim();
  // 限制兩種人進入
  // 1. 若不在資料庫的名稱無權進入 (檢查使用者有沒有在PostgreSQL 的 users Table)
  const allowedUser = await User.findByUsername(username);
  if (!allowedUser) {
    return res.status(403).json({ error: '您無權限登入聊天室' });
  }
  // 2. 相同名稱只能近一次聊天室。 (用Redis的Set 阻擋) (登出在移除)
  const isTaken = await redis.sIsMember('chat:onlineUsers', trimmedUsername);
  if (isTaken) {
    return res.status(400).json({ error: '名稱已被使用' });
  }


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
      await Message.pushToRedis(joinMsg);
      await redis.sAdd('chat:onlineUsers', trimmedUsername);
    }

    res.json({ 
      success: true, 
      username: req.session.username 
    });
  });


  
});

// 登出 API
router.post('/logout', (req, res) => {
  
  const username = req.session.username; 
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '登出失敗' });
    }
    res.clearCookie('chatroom.sid');
    res.json({ success: true });

    //刪除Redis Set 中使用的名稱 
    redis.sRem('chat:onlineUsers', username);
  });
});

// 檢查登入狀態 API
router.get('/check-session', (req, res) => {
  if (req.session.username) {
    res.json({ 
      loggedIn: true, 
      username: req.session.username 
    });
  } else {
    res.json({ loggedIn: false });
  }
});


// 註冊
router.post('/register', async (req, res) => {
   
  // 如果PostgreSQL users中沒有的話，就可以
  // 否則return 名稱已註冊
  const { username } = req.body;
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "請輸入使用者名稱" });
  }

  const trimmed = username.trim();

  try{
      const exists = await User.findByUsername(username);
      if (exists){
        return res.status(409).json({error: "名稱已註冊"});
      } 

      const result = await User.insertUser(username);
      return res.json({
        success : true ,
        user : result
      });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
    
});




module.exports = router;