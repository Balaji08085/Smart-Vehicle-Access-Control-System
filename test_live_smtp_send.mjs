import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function testLiveSmtp() {
  console.log('📧 Testing Live Gmail SMTP connection...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
  });

  const mailOptions = {
    from: `"MCC - MRF Innovation Park" <${process.env.SMTP_USER}>`,
    to: 'balap4496@gmail.com',
    subject: '✅ Live Test Email Verification — MCC-MRF Innovation Park',
    text: 'This is a live test email confirming that Gmail SMTP is functioning 100% perfectly!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0F172A; color: #ffffff; border-radius: 12px;">
        <h2 style="color: #10B981;">✅ Gmail SMTP Verified Successfully!</h2>
        <p>This is a live verification email sent from <strong>dsri_mccmrfip@mcc.edu.in</strong> to <strong>balap4496@gmail.com</strong>.</p>
        <p style="font-size: 12px; color: #94A3B8;">Sent at: ${new Date().toLocaleString('en-IN')}</p>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('🎉 EMAIL DISPATCHED SUCCESSFULLY!');
  console.log('Message ID:', info.messageId);
  console.log('Accepted Recipients:', info.accepted);
}

testLiveSmtp().catch(err => {
  console.error('❌ SMTP Dispatch Error:', err.message);
});
