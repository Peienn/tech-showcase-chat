const express = require('express');
const Message = require('../models/message');
const User = require('../models/user');
const router = express.Router();


router.get('/analysis-polling', async (req, res) => {
    try {
      const { batch_id } = req.query; // ✅ GET 用 query
  
      if (!batch_id) {
        return res.status(400).json({
          success: false,
          error: "batch_id is required"
        });
      }
  
      console.log("Polling");
      // 去 DB 查分析結果
      const analysis = await Message.getAnalysisResult(batch_id);
      if (!analysis) {
        // 還在分析中
        return res.json({
          success: true,
          status: "processing"
        });
      }
  
      // 分析完成
      return res.json({
        success: true,
        status: "done",
        analysis
      });
  
    } catch (error) {
      console.error("analysis-polling error:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  

  router.post('/analysis-done', async (req, res) => {
    try {
      const { batch_id, analysis } = req.body;
      
      console.log(`Analysis completed for batch ${batch_id} from the Python call`);
      
      // ✅ 從 req.app.locals 取得 io
      const io = req.app.locals.io;
      
      if (io) {
        io.emit('analysis-done', {
          batch_id,
          analysis
        });
        console.log("Notification frontend");
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Webhook received',
        batch_id 
      });
      
    } catch (error) {
      console.error('[Webhook] Error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

module.exports = router;