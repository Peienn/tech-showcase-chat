const { postgre } = require('../db');

class User {
  /**
   * 建立或更新使用者
   * @param {string} username 
   * @returns {Promise<{id: number, username: string}>}
   */
  static async insertUser(username) {
    try {
      const result = await postgre.query(
        `INSERT INTO users (username, last_login_at) 
         VALUES ($1, NOW())         
         RETURNING id, username`,
        [username]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('User.findOrCreate error:', err);
      throw err;
    }
  }

  /**
   * 根據 username 查詢使用者
   * @param {string} username 
   * @returns {Promise<{id: number, username: string} | null>}
   */
  static async findByUsername(username) {
    try {
      const result = await postgre.query(
        'SELECT id, username, created_at, last_login_at FROM users WHERE username = $1',
        [username]
      );
      
      return result.rows[0] || null;
    } catch (err) {
      console.error('User.findByUsername error:', err);
      throw err;
    }
  }

  /**
   * 根據 id 查詢使用者
   * @param {number} userId 
   * @returns {Promise<{id: number, username: string} | null>}
   */
  static async findById(userId) {
    try {
      const result = await postgre.query(
        'SELECT id, username, created_at, last_login_at FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0] || null;
    } catch (err) {
      console.error('User.findById error:', err);
      throw err;
    }
  }

  /**
   * 獲取使用者統計
   * @param {string} username 
   * @returns {Promise<{message_count: number, first_message: Date, last_message: Date}>}
   */
  static async getStats(username) {
    try {
      const result = await postgre.query(
        `SELECT 
          COUNT(*) as message_count,
          MIN(created_at) as first_message,
          MAX(created_at) as last_message
         FROM messages 
         WHERE username = $1`,
        [username]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('User.getStats error:', err);
      throw err;
    }
  }
}

module.exports = User;