import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    console.log('Creating database "milletverse"...');
    await connection.query('CREATE DATABASE IF NOT EXISTS milletverse');
    await connection.query('USE milletverse');

    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    let schema = await fs.readFile(schemaPath, 'utf8');

    // Remove DELIMITER lines and handle them (mysql2 multipleStatements handles semicolon-separated queries)
    // However, mysql2's multipleStatements doesn't handle DELIMITER // ... // DELIMITER ;
    // We need to strip or transform them.
    // For simplicity, I'll try to split by some logic or just use a regex to clean up common issues.
    
    // A better approach for this specific schema:
    // 1. Remove comments
    // 2. Split by semicolon, but be careful with DELIMITER blocks.
    
    console.log('Applying schema...');
    // We can try to use multipleStatements if we clean up the DELIMITER parts.
    // The schema.sql uses DELIMITER // for procedures and triggers.
    
    // Let's try a simpler approach: run the whole thing but replace DELIMITER blocks with something mysql2 likes.
    // Actually, mysql2's multipleStatements can't handle DELIMITER.
    
    const statements = schema
      .replace(/\r/g, '')
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split into parts: non-delimiter parts and delimiter parts
    // This is complex. Let's just try to execute the whole thing with multipleStatements: true
    // but without the DELIMITER commands.
    
    const cleanedSchema = statements
      .replace(/DELIMITER \/\//g, '')
      .replace(/DELIMITER ;/g, '')
      .replace(/\/\//g, ';'); // Replace // with ; in the body if it was used as a terminator

    await connection.query(cleanedSchema);
    console.log('Schema applied successfully!');

    console.log('Reading sample_data.sql...');
    const sampleDataPath = path.join(__dirname, '../database/sample_data.sql');
    try {
        const sampleData = await fs.readFile(sampleDataPath, 'utf8');
        await connection.query(sampleData);
        console.log('Sample data applied successfully!');
    } catch (err) {
        console.log('Sample data not found or already applied (ignoring).');
    }

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await connection.end();
  }
}

initDB();
