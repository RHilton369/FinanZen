require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO anon, authenticated;');
    await prisma.$executeRawUnsafe('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
    await prisma.$executeRawUnsafe('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;');
    await prisma.$executeRawUnsafe('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;');
    await prisma.$executeRawUnsafe('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;');
    console.log('Permissions granted successfully!');
  } catch (error) {
    console.error('Error granting permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
