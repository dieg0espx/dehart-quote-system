require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const nodemailer = require('nodemailer');

async function testFullSystem() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Full System Test - Quote Submission');
  console.log('═══════════════════════════════════════════\n');

  const sql = neon(process.env.DATABASE_URL);

  // Test data
  const testQuote = {
    name: 'Test User',
    email: process.env.EMAIL_USER, // Send to yourself
    phone: '555-0123',
    project_type: 'Residential',
    unit_type: 'House',
    quality: 'Premium',
    access: 'Easy',
    sqft: '2000',
    estimate_range: '$10,000 - $20,000',
    message: 'This is a test quote submission from the system test.',
    status: 'new'
  };

  try {
    // Step 1: Insert test quote into database
    console.log('📝 Step 1: Inserting test quote into database...');
    const result = await sql`
      INSERT INTO submissions (
        name, email, phone, project_type, unit_type,
        quality, access, sqft, estimate_range, message, status
      )
      VALUES (
        ${testQuote.name},
        ${testQuote.email},
        ${testQuote.phone},
        ${testQuote.project_type},
        ${testQuote.unit_type},
        ${testQuote.quality},
        ${testQuote.access},
        ${testQuote.sqft},
        ${testQuote.estimate_range},
        ${testQuote.message},
        ${testQuote.status}
      )
      RETURNING *
    `;

    console.log('✅ Quote inserted successfully!');
    console.log('   ID:', result[0].id);
    console.log('   Name:', result[0].name);
    console.log('   Email:', result[0].email);
    console.log('   Status:', result[0].status);

    // Step 2: Send email notification
    console.log('\n📧 Step 2: Sending email notification...');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '🧪 Test: New Quote Request from Dehart System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Quote Request - System Test</h2>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${testQuote.name}</p>
            <p><strong>Email:</strong> ${testQuote.email}</p>
            <p><strong>Phone:</strong> ${testQuote.phone}</p>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Project Details</h3>
            <p><strong>Project Type:</strong> ${testQuote.project_type}</p>
            <p><strong>Unit Type:</strong> ${testQuote.unit_type}</p>
            <p><strong>Quality:</strong> ${testQuote.quality}</p>
            <p><strong>Access:</strong> ${testQuote.access}</p>
            <p><strong>Square Feet:</strong> ${testQuote.sqft}</p>
            <p><strong>Estimate Range:</strong> ${testQuote.estimate_range}</p>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Message</h3>
            <p>${testQuote.message}</p>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;">
              <strong>📊 Quote ID:</strong> ${result[0].id}<br>
              <strong>⏰ Submitted:</strong> ${new Date().toLocaleString()}<br>
              <strong>📍 Status:</strong> ${testQuote.status}
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is a test email from the Dehart Quote System.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('   To:', process.env.EMAIL_USER);
    console.log('   Subject: Test: New Quote Request from Dehart System');

    // Step 3: Verify database entry
    console.log('\n🔍 Step 3: Verifying database entry...');
    const verify = await sql`
      SELECT * FROM submissions WHERE id = ${result[0].id}
    `;

    if (verify.length > 0) {
      console.log('✅ Entry verified in database!');
    }

    // Step 4: Show current table count
    const count = await sql`SELECT COUNT(*) as total FROM submissions`;
    console.log('\n📊 Current submissions in database:', count[0].total);

    console.log('\n═══════════════════════════════════════════');
    console.log('  ✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════\n');
    console.log('✉️  Check your email at:', process.env.EMAIL_USER);
    console.log('📝 Quote ID:', result[0].id, 'saved in database\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testFullSystem();
