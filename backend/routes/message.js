const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const User = require('../models/user');
const { requireAuth } = require('../middlewares/auth');

/**
 * GET /api/messages/history
 * 獲取歷史訊息
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const messages = await Message.getHistory(
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: '查詢歷史訊息失敗' });
  }
});

/**
 * GET /api/messages/search
 * 搜尋訊息
 */
// router.get('/search', requireAuth, async (req, res) => {
//   try {
//     const { keyword, limit = 50 } = req.query;
    
//     if (!keyword) {
//       return res.status(400).json({ error: '請輸入搜尋關鍵字' });
//     }
    
//     const messages = await Message.search(keyword, parseInt(limit));
    
//     res.json({
//       success: true,
//       messages,
//       count: messages.length,
//     });
//   } catch (err) {
//     console.error('Search messages error:', err);
//     res.status(500).json({ error: '搜尋訊息失敗' });
//   }
// });

/**
 * GET /api/messages/range
 * 根據時間範圍查詢訊息
 */
// router.get('/range', requireAuth, async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;
    
//     if (!startDate || !endDate) {
//       return res.status(400).json({ error: '請提供起始和結束時間' });
//     }
    
//     const messages = await Message.getByDateRange(
//       new Date(startDate),
//       new Date(endDate)
//     );
    
//     res.json({
//       success: true,
//       messages,
//       count: messages.length,
//     });
//   } catch (err) {
//     console.error('Get messages by range error:', err);
//     res.status(500).json({ error: '查詢訊息失敗' });
//   }
// });

/**
 * GET /api/messages/user/:username/stats
 * 獲取使用者統計
 */
// router.get('/user/:username/stats', requireAuth, async (req, res) => {
//   try {
//     const { username } = req.params;
    
//     const stats = await User.getStats(username);
    
//     res.json({
//       success: true,
//       stats,
//     });
//   } catch (err) {
//     console.error('Get user stats error:', err);
//     res.status(500).json({ error: '查詢統計失敗' });
//   }
// });

module.exports = router;