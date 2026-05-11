const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    
    // Check RLS status
    const result = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    
    console.log(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();
