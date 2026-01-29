const Message = require("../models/message");
const { redis }  = require("../db");
const { sendToMQ } = require("../mq/producer");

async function triggerAnalysisOnce(io) {
  // 設定 key=value
// 嘗試建立一個鎖
const locked = await redis.set("lock_analysis", "1", {
    NX: true,   // 只在 key 不存在時才寫入
    PX: 10000   // 10 秒後自動過期
  });
  
  if (!locked) {
    console.log("另一個分析正在進行，跳過本次");
  }
  

  if (!locked) {
    console.log("[analysis] already running, skip");
    return;
  }

  const messages = await Message.getAnalysisMessages(50);
  if (!messages.length) return;

  const batchId = Date.now().toString();

  await sendToMQ({
    batch_id: batchId,
    messages,
  });
  console.log("send to MQ");


  // 通知前端, 開始分析
  // 前端收到後開始polling 且等待webhook, 直到成功獲取  
  io.emit("analysis-started", { batchId });
  console.log("emit frontend");
}

module.exports = {
  triggerAnalysisOnce,
};
