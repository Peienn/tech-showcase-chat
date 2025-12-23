// 自定義 DataBase 連線區
const { redis, postgre } = require('../db');

class Message {
  /**
   * 推送訊息到 Redis（快取 + Pub/Sub）
   * @param {Object} message - {sender, text, time}
   */
  static async pushToRedis(message) {
    try {


      const json = JSON.stringify(message);
      // 1. 存入 Redis List（保留最新 50 條）
      await redis.rPush('chat:messages', json);
      await redis.lTrim('chat:messages', -50, -1);
      // 2. 發布到 Pub/Sub 頻道
      await redis.publish('chat-channel', json);
      


      // 3. 寫到Redis的同時，也要寫到資料庫(但不包含system發出的)
      if (message.sender !== '') {
        this.saveToDatabase(message).catch(err => {
          console.error('❌ DB write error:', err);
        });
      }

    } catch (err) {
      console.error('Message.pushToRedis error:', err);
      throw err;
    }
  }

  /**
   * 儲存訊息到資料庫
   * @param {Object} message - {sender, text, time, userId}
   */
  static async saveToDatabase(message) {
    try {
      // 如果沒有 userId，先查詢
      let userId = message.userId;
    
      if (!userId) {
        
      
        
        const result = await postgre.query(
          'SELECT id FROM users WHERE username = $1',
          [message.sender]
        );


        if (result.rows.length === 0) {
          if (message.sender === 'system') {
            // 自動註冊 system
            const insertUser = await postgre.query(
              'INSERT INTO users (username) VALUES ($1) RETURNING id',
              ['system']
            );
            userId = insertUser.rows[0].id;

            console.log('✅ System user auto-registered:', userId);
          } else {
            console.warn(`⚠️ User not found: ${message.sender}`);
            return; // 非 system 的話就不儲存
          }
        } else {
          userId = result.rows[0].id;
        }
      }
      

      await postgre.query(
        'INSERT INTO messages (user_id, username, text, created_at) VALUES ($1, $2, $3, $4)',
        [userId, message.sender, message.text, message.time]
      );
    } catch (err) {
      console.error('Message.saveToDatabase error:', err);
      throw err;
    }
  }

  /**
   * 從 Redis 讀取最新訊息
   * @returns {Promise<Array>}
   */
  // /register用
  static async getFromRedis() {
    try {
      // 1️⃣ 先從 Redis 取
      const raw = await redis.lRange('chat:messages', 0, -1);
  
      if (raw.length > 49) {
        console.log('📦 messages from redis');
        return raw.map(item => JSON.parse(item));
      }
  
      // 2️⃣ Redis 沒資料 → 從 PostgreSQL 撈
      console.log('🗄 redis empty, loading from postgres');
  
      const { rows } = await postgre.query(`
        SELECT username, text, created_at as time
        FROM messages
        ORDER BY created_at DESC
        LIMIT 50
      `);
      const messages = rows.map(row => ({
        sender: row.username,
        text: row.text,
        time: row.time
      }));
  
      messages.reverse(); // 由舊到新
  
      // 放進 Redis
      const pipeline = redis.multi();
      messages.forEach(msg => {
        pipeline.rPush('chat:messages', JSON.stringify(msg));
      });
      await pipeline.exec();
  
      return messages;
  
    } catch (err) {
      console.error('Message.getFromRedis error:', err);
      throw err;
    }
  }
  

  /**
   * 從資料庫讀取歷史訊息
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>}
   */
  static async getHistory(limit = 100, offset = 0) {
    try {
      const result = await postgre.query(
        `SELECT username, text, created_at as time 
         FROM messages 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      
      const messages = result.rows.map(row => ({
        sender: row.username, // 使用者名稱
        text: row.text,
        time: row.time
      }));
      console.log(messages);

      // 反轉順序（最舊的在前）
      return messages.reverse();
    } catch (err) {
      console.error('Message.getHistory error:', err);
      throw err;
    }
  }

  // /**
  //  * 根據時間範圍查詢訊息
  //  * @param {Date} startDate 
  //  * @param {Date} endDate 
  //  * @returns {Promise<Array>}
  //  */
  // static async getByDateRange(startDate, endDate) {
  //   try {
  //     const result = await postgre.query(
  //       `SELECT username, text, created_at as time 
  //        FROM messages 
  //        WHERE created_at BETWEEN $1 AND $2 
  //        ORDER BY created_at ASC`,
  //       [startDate, endDate]
  //     );
      
  //     return result.rows;
  //   } catch (err) {
  //     console.error('Message.getByDateRange error:', err);
  //     throw err;
  //   }
  // }

  // /**
  //  * 搜尋包含關鍵字的訊息
  //  * @param {string} keyword 
  //  * @param {number} limit 
  //  * @returns {Promise<Array>}
  //  */
  // static async search(keyword, limit = 50) {
  //   try {
  //     const result = await postgre.query(
  //       `SELECT username, text, created_at as time 
  //        FROM messages 
  //        WHERE text ILIKE $1 
  //        ORDER BY created_at DESC 
  //        LIMIT $2`,
  //       [`%${keyword}%`, limit]
  //     );
      
  //     return result.rows;
  //   } catch (err) {
  //     console.error('Message.search error:', err);
  //     throw err;
  //   }
  // }
}

module.exports = Message;