require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const nodemailer = require('nodemailer');

async function testDatabase() {
  console.log('\n🔍 Testing Database Connection...\n');

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Test connection with a simple query
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Database connection successful!');
    console.log('   Current time:', result[0].current_time);
    console.log('   PostgreSQL version:', result[0].pg_version.split('\n')[0]);

    // Check if quotes table exists
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('\n📊 Tables in database:');
    tables.forEach(table => console.log('   -', table.table_name));

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testEmail() {
  console.log('\n📧 Testing Email Configuration...\n');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ Email configuration verified!');
    console.log('   Email account:', process.env.EMAIL_USER);
    console.log('   SMTP service: Gmail');

    return true;
  } catch (error) {
    console.error('❌ Email configuration failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Testing Dehart Quote System Configuration');
  console.log('═══════════════════════════════════════════');

  const dbSuccess = await testDatabase();
  const emailSuccess = await testEmail();

  console.log('\n═══════════════════════════════════════════');
  console.log('  Test Results Summary');
  console.log('═══════════════════════════════════════════\n');
  console.log('Database:', dbSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('Email:   ', emailSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('\n');

  if (dbSuccess && emailSuccess) {
    console.log('🎉 All tests passed! Your system is ready.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check your configuration.\n');
    process.exit(1);
  }
}

runTests();
