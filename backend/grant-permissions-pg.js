const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated;');
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
    await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;');
    
    // Also explicitly grant to transactions table just to be sure
    await client.query('GRANT ALL ON TABLE public.transactions TO anon, authenticated;');

    console.log('Permissions granted successfully!');
  } catch (error) {
    console.error('Error granting permissions:', error);
  } finally {
    await client.end();
  }
}

main();
