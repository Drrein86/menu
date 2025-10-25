const { Client } = require('pg');

console.log('🔍 Testing PostgreSQL connection...');
console.log('==========================================');

const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!dbUrl) {
  console.error('❌ No DATABASE_URL or DATABASE_PUBLIC_URL found!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG')));
  process.exit(1);
}

console.log('✅ Found URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
console.log('📍 Contains sslmode=disable?', dbUrl.includes('sslmode=disable') ? '✅ YES' : '⚠️ NO');

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

(async () => {
  try {
    console.log('\n🔌 Attempting to connect...');
    const startTime = Date.now();
    
    await client.connect();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Connected! (${duration}ms)`);
    
    console.log('\n🧪 Running test query...');
    const res = await client.query('SELECT 1 as test, NOW() as time');
    console.log('✅ Query result:', res.rows[0]);
    
    await client.end();
    console.log('\n✅ Connection test PASSED! 🎉');
    console.log('==========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Connection test FAILED!');
    console.error('==========================================');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('==========================================\n');
    process.exit(1);
  }
})();

