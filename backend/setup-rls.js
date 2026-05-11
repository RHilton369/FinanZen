const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();

    console.log('Enabling RLS on all tables...');
    const tables = ['users', 'branches', 'customers', 'suppliers', 'bank_accounts', 'chart_of_accounts', 'transactions', 'message_logs'];
    
    for (const table of tables) {
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }

    console.log('Creating policies for users...');
    await client.query(`
      DROP POLICY IF EXISTS "Users can only access their own data" ON public.users;
      CREATE POLICY "Users can only access their own data" ON public.users
      FOR ALL USING (auth.uid() = id);
    `);

    console.log('Creating policies for branches...');
    await client.query(`
      DROP POLICY IF EXISTS "Users can only access their branches" ON public.branches;
      CREATE POLICY "Users can only access their branches" ON public.branches
      FOR ALL USING (auth.uid() = user_id);
    `);

    const branchRelatedTables = ['customers', 'suppliers', 'bank_accounts', 'chart_of_accounts', 'transactions'];
    
    for (const table of branchRelatedTables) {
      console.log(`Creating policies for ${table}...`);
      await client.query(`
        DROP POLICY IF EXISTS "Users can only access branch data" ON public.${table};
        CREATE POLICY "Users can only access branch data" ON public.${table}
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.branches 
            WHERE branches.id = ${table}.branch_id 
            AND branches.user_id = auth.uid()
          )
        );
      `);
    }

    console.log('Creating policies for message_logs...');
    await client.query(`
      DROP POLICY IF EXISTS "Users can access their message logs" ON public.message_logs;
      CREATE POLICY "Users can access their message logs" ON public.message_logs
      FOR ALL USING (auth.uid() = user_id);
    `);

    console.log('RLS applied successfully.');

  } catch (error) {
    console.error('Error applying RLS:', error);
  } finally {
    await client.end();
  }
}

main();
