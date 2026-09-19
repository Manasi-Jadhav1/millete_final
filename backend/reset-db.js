import pool from './config/database.js';

async function resetDB() {
  try {
    console.log('Resetting database dummy data...');
    const connection = await pool.getConnection();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = ['admin_logs', 'cart', 'reviews', 'orders', 'products', 'learning_content', 'health_profiles', 'users'];
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE ${table}`);
      console.log(`Truncated ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    connection.release();
    console.log('Database dummy data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting DB:', error);
    process.exit(1);
  }
}

resetDB();
