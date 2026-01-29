const { redis } = require("../db");

async function sendToMQ(payload) {
  await redis.xAdd(
    "chat_analysis_stream",
    "*",
    {
      data: JSON.stringify(payload)
    }
  );
}

module.exports = { sendToMQ };