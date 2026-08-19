import fs from 'fs';
import path from 'path';
import nodemailer from './backend/node_modules/nodemailer/lib/nodemailer.js';

function loadEnv() {
  const envPath = path.join(process.cwd(), 'backend', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function testEmail() {
  const user = process.env.SMTP_USER || 'dsri_mccmrfip@mcc.edu.in';
  const pass = process.env.SMTP_PASS || 'avjhnzwpkdgikyam';

  console.log('Testing Gmail Service Transporter with user:', user);

  // Method 1: Nodemailer service: 'gmail'
  const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  try {
    console.log('Verifying Gmail Service...');
    await gmailTransporter.verify();
    console.log('✅ Gmail Service verified successfully!');

    console.log('Sending test email via Gmail Service...');
    const info = await gmailTransporter.sendMail({
      from: `"MRF Vehicle Security" <${user}>`,
      to: 'dsri_mccmrfip@mcc.edu.in',
      subject: 'Test Email Verification - SVACS',
      text: 'This is a test email from SVACS system.'
    });
    console.log('🎉 EMAIL SENT SUCCESSFULLY! MessageId:', info.messageId);
    return;
  } catch (err1) {
    console.error('❌ Gmail Service Failed:', err1.message);
  }

  // Method 2: Port 465 Direct SSL
  console.log('Testing Port 465 Direct SSL Transporter...');
  const port465Transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  });

  try {
    console.log('Verifying Port 465 Direct SSL...');
    await port465Transporter.verify();
    console.log('✅ Port 465 verified successfully!');

    const info = await port465Transporter.sendMail({
      from: `"MRF Vehicle Security" <${user}>`,
      to: 'dsri_mccmrfip@mcc.edu.in',
      subject: 'Test Email Verification - SVACS (Port 465)',
      text: 'This is a test email from SVACS system.'
    });
    console.log('🎉 EMAIL SENT SUCCESSFULLY! MessageId:', info.messageId);
  } catch (err2) {
    console.error('❌ Port 465 Failed:', err2.message);
  }
}

testEmail();
