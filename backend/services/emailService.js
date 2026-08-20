import EmailLog from '../models/EmailLog.js';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dns from 'dns';

import fs from 'fs';
import path from 'path';

// Helper to get base64 MCC Logo image for HTML emails
const getMccLogoBase64 = () => {
  try {
    const pathsToTry = [
      path.join(process.cwd(), 'public', 'favicon.png'),
      path.join(process.cwd(), 'public', 'mcc_logo.jpg'),
      path.join(process.cwd(), 'src', 'assets', 'favicon.png'),
      'C:\\Users\\hp\\Downloads\\3c98d685-d7b2-4201-ac74-0e8ebeb14ce5.png'
    ];
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        const fileData = fs.readFileSync(p);
        return `data:image/png;base64,${fileData.toString('base64')}`;
      }
    }
  } catch (err) {
    console.error('Error loading MCC logo image for email:', err.message);
  }
  return '';
};

// Helper to get MCC Logo CID attachment for Nodemailer
const getMccLogoAttachment = () => {
  try {
    const pathsToTry = [
      path.join(process.cwd(), 'public', 'favicon.png'),
      path.join(process.cwd(), 'public', 'mcc_logo.jpg'),
      path.join(process.cwd(), 'src', 'assets', 'favicon.png'),
      'C:\\Users\\hp\\Downloads\\3c98d685-d7b2-4201-ac74-0e8ebeb14ce5.png'
    ];
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        return {
          filename: 'mcc_logo.png',
          path: p,
          cid: 'mcc_header_logo'
        };
      }
    }
  } catch (err) {
    console.error('Error finding MCC logo attachment:', err.message);
  }
  return null;
};

// Force IPv4 lookup for Gmail SMTP to prevent IPv6 ENETUNREACH errors on Windows
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

// In-memory fallback logs for standalone mode
export const inMemoryEmailLogs = [];

// Duplicate protection cache: key -> timestamp (ms)
const recentEmailScans = new Map();
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const isDbConnected = () => mongoose.connection.readyState === 1;

let etherealTransporter = null;

// Custom DNS lookup to enforce IPv4 only (prevents Windows IPv6 ENETUNREACH errors)
const ipv4Lookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { family: 4 }, callback);
};

// Helper to create Nodemailer Transporter
const createTransporter = async () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
  const rawFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || user || 'dsri_mccmrfip@mcc.edu.in';
  
  let fromEmail = rawFrom;
  const match = rawFrom.match(/<([^>]+)>/);
  if (match) {
    fromEmail = match[1];
  }

  if (user && pass) {
    const isGmail = host.includes('gmail') || user.includes('gmail') || user.includes('mcc.edu.in');
    
    const transporterConfig = isGmail ? {
      service: 'gmail',
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    } : {
      host,
      port,
      secure,
      lookup: ipv4Lookup,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    };

    return {
      transporter: nodemailer.createTransport(transporterConfig),
      fromEmail: user,
      isRealSmtp: true,
      smtpHost: isGmail ? 'smtp.gmail.com' : host,
      smtpPort: isGmail ? 465 : port
    };
  }

  // Fallback: Create Ethereal Test Account if real SMTP credentials are missing
  if (!etherealTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`💡 Ethereal SMTP Test Inbox initialized: ${testAccount.user}`);
    } catch (e) {
      console.warn('Could not initialize Ethereal test account:', e.message);
      return null;
    }
  }

  return {
    transporter: etherealTransporter,
    fromEmail: 'dsri_mccmrfip@mcc.edu.in',
    isRealSmtp: false,
    smtpHost: 'smtp.ethereal.email',
    smtpPort: 587
  };
};

// ═══════════════════════════════════════════════════════════════════
// ██  PROFESSIONAL EMAIL TEMPLATES — MCC MAROON + WHITE + BLACK TEXT
// ═══════════════════════════════════════════════════════════════════

/** Professional email wrapper — MCC Maroon + White + High-Contrast Black Font */
const emailWrapper = (statusColor, content, footerExtra = '') => {
  const logoDataUri = getMccLogoBase64();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>MCC - MRF Innovation Park Access</title>
  <style>
    :root { color-scheme: light; }
    body { background-color: #f8fafc !important; color: #0F172A !important; }
    .email-card { background-color: #ffffff !important; color: #0F172A !important; }
    .black-text { color: #0F172A !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- MAIN CONTAINER CARD -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="email-card" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(112,26,26,0.15); border: 1px solid #E2E8F0;">
          
          <!-- ═══ MCC MAROON EXECUTIVE HEADER ═══ -->
          <tr>
            <td style="background-color: #701A1A; padding: 28px 24px; text-align: center; border-bottom: 4px solid ${statusColor === '#D97706' ? '#701A1A' : statusColor};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 14px;">
                          <img src="cid:mcc_header_logo" width="54" height="54" style="display: block; border-radius: 8px; border: 2px solid #FFFFFF; background-color: #ffffff; padding: 3px; object-fit: contain;" alt="MCC Logo" />
                        </td>
                        <td style="text-align: left; vertical-align: middle;">
                          <p style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF !important; letter-spacing: 2px; line-height: 1.1;">MCC - MRF</p>
                          <p style="margin: 3px 0 0; font-size: 10px; font-weight: 800; color: #FFFFFF !important; letter-spacing: 2px; text-transform: uppercase;">Innovation Park &bull; Madras Christian College</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <p style="margin: 0; font-size: 8.5px; font-weight: 800; color: #FFFFFF !important; letter-spacing: 2px; text-transform: uppercase;">Smart Vehicle Access Control System</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ BODY CONTENT ═══ -->
          ${content}

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="padding: 24px 36px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              ${footerExtra}
              <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #701A1A;">Madras Christian College &bull; MCC - MRF Innovation Park</p>
              <p style="margin: 0 0 12px; font-size: 10px; color: #64748B;">Official Automated Notification &bull; Smart Vehicle Access Control Terminal</p>
              <p style="margin: 0; font-size: 9px; font-weight: 700; color: #94A3B8; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} MCC - MRF Innovation Park &bull; All Rights Reserved</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/** Detail row — executive clean table row style */
const detailRow = (icon, label, value, valueColor = '#475569', isBold = false, isMono = false) => `
  <tr>
    <td style="padding: 12px 18px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #0F172A; font-weight: 900; width: 42%; vertical-align: middle;">
      <span style="margin-right: 8px; font-size: 14px;">${icon}</span>${label}
    </td>
    <td style="padding: 12px 18px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: ${valueColor === '#0F172A' ? '#475569' : valueColor}; font-weight: 600; ${isMono ? 'font-family: Consolas, Monaco, Courier New, monospace; letter-spacing: 0.5px;' : ''} vertical-align: middle;">
      ${value}
    </td>
  </tr>
`;

/** Helper to generate crisp Avatar Badge that NEVER breaks in Gmail */
const getAvatarBadge = (name) => {
  const cleanName = (name || 'USER').trim();
  const parts = cleanName.split(' ');
  let initials = cleanName.charAt(0).toUpperCase();
  if (parts.length > 1 && parts[parts.length - 1]) {
    initials += parts[parts.length - 1].charAt(0).toUpperCase();
  }
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); width: 80px; height: 80px; border-radius: 50%; text-align: center; vertical-align: middle; color: #FFFFFF; font-size: 30px; font-weight: 900; font-family: -apple-system, sans-serif; letter-spacing: 1px; border: 4px solid #ECFDF5; box-shadow: 0 6px 18px rgba(16,185,129,0.3);">
                ${initials}
              </td>
            </tr>
          </table>
          <p style="margin: 12px 0 2px; font-size: 20px; font-weight: 900; color: #0F172A; letter-spacing: 0.5px;">${cleanName}</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 4px auto 0;">
            <tr>
              <td style="background-color: #ECFDF5; border: 1.5px solid #10B981; padding: 4px 14px; border-radius: 20px;">
                <span style="color: #047857; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">✓ VERIFIED PROFILE</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

// ═══════════════════════════════════════════════════════════════════
// ██  1. APPROVAL EMAIL
// ═══════════════════════════════════════════════════════════════════

export const sendApprovalEmail = async (request, qrUrl) => {
  const transportObj = await createTransporter();
  const transporter = transportObj ? transportObj.transporter : null;
  const subject = `Campus Bike Access Approved — ${request.bikeNumber}`;
  const startDateStr = request.accessStartDate ? new Date(request.accessStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '7/31/2026';
  const expiryDateStr = request.accessExpiryDate ? new Date(request.accessExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '10/31/2026';

  let attachments = [];
  const mccLogoAtt = getMccLogoAttachment();
  if (mccLogoAtt) attachments.push(mccLogoAtt);
  let imageSource = '';

  if (request.photoUrl && request.photoUrl.startsWith('data:image')) {
    try {
      const format = request.photoUrl.split(';')[0].split('/')[1];
      const base64Data = request.photoUrl.split(';base64,')[1];
      attachments.push({
        filename: `profile.${format}`,
        content: Buffer.from(base64Data, 'base64'),
        cid: 'applicant_photo'
      });
      imageSource = 'cid:applicant_photo';
    } catch (e) {
      console.error('Failed to parse base64 photo for email attachment:', e.message);
      imageSource = request.photoUrl;
    }
  } else if (request.photoUrl) {
    imageSource = request.photoUrl;
  }

  const photoSection = imageSource ? `
    <tr>
      <td align="center" style="padding: 20px 0 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 4px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; box-shadow: 0 6px 18px rgba(16,185,129,0.3);">
              <img src="${imageSource}" alt="${request.name}" width="90" height="90" style="border-radius: 50%; object-fit: cover; border: 3px solid #ffffff; display: block;" />
            </td>
          </tr>
        </table>
        <p style="margin: 12px 0 2px; font-size: 20px; font-weight: 900; color: #0F172A;">${request.name}</p>
        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #059669; font-mono: monospace;">${request.email}</p>
      </td>
    </tr>
  ` : getAvatarBadge(request.name);

  const htmlBody = emailWrapper('#10B981', `
    <tr>
      <td style="padding: 32px 40px 28px;">
        <!-- STATUS BADGE -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #ECFDF5; border: 2px solid #10B981; padding: 12px 36px; border-radius: 50px; text-align: center; box-shadow: 0 4px 14px rgba(16,185,129,0.15);">
                    <span style="color: #059669; font-size: 16px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">APPROVED — ACCESS GRANTED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- APPLICANT PHOTO PROFILE -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${photoSection}
        </table>

        <!-- GREETING -->
        <p style="font-size: 15px; color: #0F172A; margin: 16px 0 6px; line-height: 1.6; font-weight: 700;">Hello <strong>${request.name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.7; font-weight: 500;">Super Admin has <strong style="color: #059669;">APPROVED</strong> your vehicle access request! Your vehicle is now officially authorized for entry through MCC MRF Innovation Park gate security checkpoints.</p>

        <!-- LICENSE PLATE CARD -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #FFF5F5; border: 2px solid #701A1A; padding: 12px 32px; border-radius: 14px; text-align: center; box-shadow: 0 4px 14px rgba(112,26,26,0.12);">
                    <span style="font-size: 9px; font-weight: 900; color: #701A1A; letter-spacing: 2.5px; text-transform: uppercase; display: block; margin-bottom: 3px;">AUTHORIZED LICENSE PLATE</span>
                    <span style="font-family: 'Consolas', 'Courier New', monospace; font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: 3px;">${request.bikeNumber}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- OFFICIAL QR CODE ACCESS STICKER CARD -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFBFC; border-radius: 20px; border: 2px dashed #10B981; padding: 26px 20px; text-align: center; margin-bottom: 24px; box-shadow: 0 6px 20px rgba(16,185,129,0.08);">
          <tr>
            <td align="center">
              <p style="margin: 0 0 4px; font-size: 11px; font-weight: 900; color: #059669; letter-spacing: 2.5px; text-transform: uppercase;">Official Vehicle Access Pass QR Sticker</p>
              <p style="margin: 0 0 16px; font-size: 18px; font-weight: 900; color: #0F172A; font-family: Consolas, monospace; letter-spacing: 1px;">${request.bikeNumber}</p>
              
              <!-- EMBEDDED QR CODE IMAGE -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px;">
                <tr>
                  <td style="background-color: #ffffff; padding: 14px; border-radius: 20px; border: 1.5px solid #E2E8F0; box-shadow: 0 6px 18px rgba(0,0,0,0.08);">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(request.token || qrUrl || request.bikeNumber)}" width="200" height="200" alt="Official QR Pass Code" style="display: block; border-radius: 12px;" />
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 900; color: #0F172A;">QR PASS TOKEN: <span style="font-family: Consolas, monospace; color: #047857; background-color: #ECFDF5; border: 1px solid #10B981; padding: 2px 8px; border-radius: 6px;">${request.token || 'N/A'}</span></p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #059669; font-weight: 800;">✓ Ready for Security Gate QR Scanner & Automated Barrier Release</p>
            </td>
          </tr>
        </table>

        <!-- COMPLETE AUTHORIZED VEHICLE DETAILS GRID -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFBFC; border-radius: 14px; border: 1px solid #E2E8F0; overflow: hidden; margin-bottom: 24px;">
          <tr>
            <td colspan="2" style="padding: 14px 18px; background-color: #FFF5F5; border-bottom: 2px solid #701A1A;">
              <strong style="color: #701A1A; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">📋 AUTHORIZED ACCESS PERMIT DETAILS</strong>
            </td>
          </tr>
          ${detailRow('', 'Applicant Name', request.name, '#0F172A', true)}
          ${detailRow('', 'Email Address', request.email, '#0F172A')}
          ${detailRow('', 'Vehicle Plate No', request.bikeNumber, '#0F172A', true, true)}
          ${detailRow('', 'Department / Course', request.department || 'TEKQUORA • MCA', '#0F172A')}
          ${detailRow('', 'Designation / Role', request.designation || 'FULL STACK DEVELOPER', '#0F172A')}
          ${detailRow('', 'Company / Institution', request.company || 'TEKQUORA', '#0F172A')}
          ${detailRow('📅', 'Valid Start Date', startDateStr, '#059669', true)}
          ${detailRow('⏰', 'Valid Expiry Date', expiryDateStr, '#059669', true)}
        </table>

        <!-- ONLINE DIGITAL PASS BUTTON -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <a href="${qrUrl || '#'}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #059669, #10B981); color: #ffffff; padding: 15px 46px; border-radius: 50px; font-size: 14px; font-weight: 900; text-decoration: none; letter-spacing: 1px; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);">🔗 VIEW DIGITAL PASS & PRINT QR STICKER</a>
            </td>
          </tr>
        </table>
        <p style="font-size: 11px; color: #64748B; text-align: center; margin: 0; font-weight: 500;">Save this email or present the QR code to security gate officers upon campus entry.</p>
      </td>
    </tr>
  `);

  const textBody = `Dear ${request.name},\n\nYour bike access request for vehicle ${request.bikeNumber} has been APPROVED.\n\nApplicant: ${request.name}\nEmail: ${request.email}\nVehicle Plate: ${request.bikeNumber}\nDepartment: ${request.department}\nDesignation: ${request.designation || 'FULL STACK DEVELOPER'}\nValidity: ${startDateStr} — ${expiryDateStr}\nQR Token: ${request.token || 'N/A'}\n\nMRF Vehicle Security — Smart Access Control System`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MRF Vehicle Security" <${transportObj.fromEmail}>`,
        to: request.email,
        subject,
        text: textBody,
        html: htmlBody,
        attachments
      });
      console.log(`✅ Approval email dispatched to ${request.email} via Nodemailer.`);
    } catch (e) {
      console.error(`❌ Nodemailer send error to ${request.email}:`, e.message);
    }
  }

  console.log('----------------------------------------------------');
  console.log(`📧 EMAIL DISPATCHED: Approval Notification -> ${request.email}`);
  console.log(`Subject: ${subject}`);
  console.log('----------------------------------------------------');
  return true;
};

// ═══════════════════════════════════════════════════════════════════
// ██  2. REJECTION EMAIL
// ═══════════════════════════════════════════════════════════════════

export const sendRejectionEmail = async (request, reason) => {
  const transportObj = await createTransporter();
  const transporter = transportObj ? transportObj.transporter : null;
  const subject = `Vehicle Access Application Rejected — ${request.bikeNumber}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  let attachments = [];
  const mccLogoAtt = getMccLogoAttachment();
  if (mccLogoAtt) attachments.push(mccLogoAtt);
  let imageSource = '';

  if (request.photoUrl && request.photoUrl.startsWith('data:image')) {
    try {
      const format = request.photoUrl.split(';')[0].split('/')[1];
      const base64Data = request.photoUrl.split(';base64,')[1];
      attachments.push({
        filename: `profile.${format}`,
        content: Buffer.from(base64Data, 'base64'),
        cid: 'applicant_photo'
      });
      imageSource = 'cid:applicant_photo';
    } catch (e) {
      console.error('Failed to parse base64 photo for email attachment:', e.message);
      imageSource = request.photoUrl;
    }
  } else if (request.photoUrl) {
    imageSource = request.photoUrl;
  }

  const photoSection = imageSource ? `
    <tr>
      <td align="center" style="padding: 20px 0 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 4px; background: #EF4444; border-radius: 50%;">
              <img src="${imageSource}" alt="${request.name}" width="90" height="90" style="border-radius: 50%; object-fit: cover; border: 3px solid #ffffff; display: block;" />
            </td>
          </tr>
        </table>
        <p style="margin: 12px 0 2px; font-size: 20px; font-weight: 900; color: #0F172A;">${request.name}</p>
        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #DC2626; font-mono: monospace;">${request.email}</p>
      </td>
    </tr>
  ` : getAvatarBadge(request.name);

  const htmlBody = emailWrapper('#EF4444', `
    <tr>
      <td style="padding: 32px 40px 28px;">
        <!-- STATUS BADGE -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #FEF2F2; border: 2px solid #EF4444; padding: 12px 36px; border-radius: 50px; text-align: center;">
                    <span style="color: #DC2626; font-size: 16px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">REJECTED — ACCESS DENIED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- APPLICANT PHOTO PROFILE -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${photoSection}
        </table>

        <!-- GREETING -->
        <p style="font-size: 15px; color: #334155; margin: 16px 0 6px;">Hello <strong>${request.name}</strong>,</p>
        <p style="font-size: 14px; color: #64748B; margin: 0 0 24px; line-height: 1.7;">We regret to inform you that your vehicle access permit request for <strong style="color: #DC2626;">${request.bikeNumber}</strong> has been rejected by Super Admin Security Administration.</p>

        <!-- REJECTION DETAILS CARD -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFBFC; border-radius: 14px; border: 1px solid #FECACA; overflow: hidden; margin-bottom: 24px;">
          <tr>
            <td colspan="2" style="padding: 14px 18px; background-color: #FEF2F2; border-bottom: 2px solid #FECACA;">
              <strong style="color: #991B1B; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">REJECTION RECORD DETAILS</strong>
            </td>
          </tr>
          ${detailRow('', 'Applicant Name', request.name, '#475569')}
          ${detailRow('', 'Email Address', request.email, '#475569')}
          ${detailRow('', 'Vehicle Number', request.bikeNumber, '#475569', false, true)}
          ${detailRow('', 'Department', request.department || 'N/A', '#475569')}
          ${detailRow('', 'Decision Date', dateStr, '#475569')}
          ${detailRow('', 'Rejection Reason', reason || 'Document verification mismatch or invalid permit details', '#475569')}
        </table>

        <!-- APPEAL BOX -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFBEB; border-radius: 14px; border: 1px solid #FDE68A; margin-bottom: 16px;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0; font-size: 12px; color: #92400E; line-height: 1.6;">
                <strong>Appeal Procedure:</strong> If you believe your request was rejected in error, please re-submit your bike registration with complete documents or visit the Campus Security Administrative Office.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);

  const textBody = `Dear ${request.name},\n\nWe regret to inform you that your bike access request for vehicle ${request.bikeNumber} has been REJECTED.\n\nApplicant: ${request.name}\nEmail: ${request.email}\nVehicle Number: ${request.bikeNumber}\nReason: ${reason}\nDate: ${dateStr}\n\nMRF Vehicle Security — Smart Access Control System`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MRF Vehicle Security" <${transportObj.fromEmail}>`,
        to: request.email,
        subject,
        text: textBody,
        html: htmlBody,
        attachments
      });
      console.log(`✅ Rejection email dispatched to ${request.email} via Nodemailer.`);
    } catch (e) {
      console.error(`❌ Nodemailer send error to ${request.email}:`, e.message);
    }
  }

  console.log('----------------------------------------------------');
  console.log(`📧 EMAIL SENT: Rejection Notification -> ${request.email}`);
  console.log(`Subject: ${subject}`);
  console.log('----------------------------------------------------');
  return true;
};

// ═══════════════════════════════════════════════════════════════════
// ██  3. SCAN VERIFICATION EMAIL (Entry Allowed)
// ═══════════════════════════════════════════════════════════════════

/**
 * Sends entry verification email ONLY when status is ACCESS ALLOWED (VERIFIED / GRANTED).
 * Includes 5-minute duplicate protection and EmailLog table recording.
 */
export const sendScanVerificationEmail = async (request, qrToken = 'N/A', guardName = 'Main Gate Security Guard', gateName = 'Main Security Gate') => {
  if (!request || !request.email) return false;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const scanId  = `SCAN-${Date.now()}`;
  const cacheKey = `${request.bikeNumber || request._id}_${request.email.toLowerCase()}`;

  try {
    // ── 1. DUPLICATE EMAIL PROTECTION (5-minute window) ──
    const lastSentTime = recentEmailScans.get(cacheKey);
    let isDuplicate = false;

    if (lastSentTime && (now.getTime() - lastSentTime < DUPLICATE_WINDOW_MS)) {
      isDuplicate = true;
    }

    if (!isDuplicate && isDbConnected()) {
      const fiveMinutesAgo = new Date(now.getTime() - DUPLICATE_WINDOW_MS);
      const recentDbLog = await EmailLog.findOne({
        email: request.email,
        emailType: 'Entry Verification',
        status: 'Sent',
        createdAt: { $gte: fiveMinutesAgo }
      });
      if (recentDbLog) isDuplicate = true;
    }

    if (isDuplicate) {
      const suppLog = {
        request: request._id,
        email: request.email,
        qrToken: qrToken || request.token || 'N/A',
        scanId,
        emailType: 'Entry Verification',
        status: 'Suppressed (Duplicate Window)',
        date: dateStr,
        time: timeStr,
        errorMessage: 'Duplicate scan within 5-minute window. Email suppressed to prevent spam.'
      };

      if (isDbConnected()) {
        await EmailLog.create(suppLog);
      }
      inMemoryEmailLogs.unshift(suppLog);

      console.log('----------------------------------------------------');
      console.log(`ℹ️ EMAIL SUPPRESSED (DUPLICATE 5-MIN WINDOW) -> ${request.email}`);
      console.log(`Bike Number: ${request.bikeNumber} | Scan ID: ${scanId}`);
      console.log('----------------------------------------------------');
      return { sent: false, suppressed: true, reason: 'DUPLICATE_WINDOW' };
    }

    // ── 2. FORMAT VERIFICATION SUCCESS EMAIL ──
    const subject = `✅ Vehicle Entry Verified — ${request.bikeNumber}`;

    const htmlBody = emailWrapper('#059669', `
      <tr>
        <td style="padding: 32px 36px 28px;">
          <!-- VERIFIED ENTRY HERO CARD -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ECFDF5; border: 2px solid #059669; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(5,150,105,0.12);">
                  <tr>
                    <td style="padding: 22px 24px; text-align: center;">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 6px;">
                        <tr>
                          <td style="background-color: #059669; width: 36px; height: 36px; border-radius: 50%; text-align: center; vertical-align: middle; color: #FFFFFF; font-size: 20px; font-weight: bold;">
                            ✓
                          </td>
                          <td style="padding-left: 10px; font-size: 22px; font-weight: 900; color: #064E3B; letter-spacing: 2px; text-transform: uppercase;">
                            VERIFIED ENTRY
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0; font-size: 11px; font-weight: 800; color: #047857; letter-spacing: 2.5px; text-transform: uppercase;">ACCESS GRANTED &bull; CAMPUS SECURITY CHECKPOINT</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- EXECUTIVE AVATAR PROFILE BADGE (100% BULLETPROOF - NEVER BREAKS) -->
          ${getAvatarBadge(request.name)}

          <!-- GREETING & CONFIRMATION -->
          <p style="font-size: 15px; color: #334155; margin: 0 0 6px; line-height: 1.6;">Hello <strong>${request.name}</strong>,</p>
          <p style="font-size: 14px; color: #64748B; margin: 0 0 20px; line-height: 1.7;">Your vehicle has been <strong style="color: #059669;">successfully verified</strong> by campus gate security. Your entry has been officially recorded in the security database.</p>

          <!-- AUTHORIZED LICENSE PLATE CARD -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background-color: #FEF3C7; border: 2px solid #D97706; padding: 10px 28px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(217,119,6,0.15);">
                      <span style="font-size: 9px; font-weight: 900; color: #92400E; letter-spacing: 2.5px; text-transform: uppercase; display: block; margin-bottom: 2px;">VERIFIED VEHICLE PLATE</span>
                      <span style="font-family: 'Consolas', 'Courier New', monospace; font-size: 22px; font-weight: 900; color: #78350F; letter-spacing: 3px;">${request.bikeNumber}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- ENTRY DETAILS DATA GRID -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFBFC; border-radius: 14px; border: 1px solid #E2E8F0; overflow: hidden; margin-bottom: 24px;">
            <tr>
              <td colspan="2" style="padding: 14px 18px; background-color: #F1F5F9; border-bottom: 2px solid #E2E8F0;">
                <strong style="color: #1E293B; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">🚗 SECURITY ENTRY DETAILS</strong>
              </td>
            </tr>
            ${detailRow('👤', 'Full Name', request.name)}
            ${detailRow('🏢', 'Department', request.department || 'General Campus Access')}
            ${detailRow('🚗', 'Vehicle Number', request.bikeNumber, '#D97706', true, true)}
            ${detailRow('🔑', 'QR Pass Token', qrToken || request.token || 'N/A', '#6D28D9', false, true)}
            ${detailRow('🛡️', 'Verified By', 'Campus Security Officer', '#059669', true)}
            ${detailRow('📅', 'Entry Date', dateStr)}
            ${detailRow('⏰', 'Entry Time', timeStr, '#2563EB', true)}
          </table>

          <!-- OFFICIAL SECURITY WATERMARK BADGE -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border-radius: 12px; border: 1px solid #A7F3D0; margin-bottom: 12px;">
            <tr>
              <td style="padding: 16px 20px; text-align: center;">
                <p style="margin: 0 0 4px; font-size: 10px; font-weight: 800; color: #047857; letter-spacing: 2px; text-transform: uppercase;">SECURITY CHECKPOINT &bull; OFFICIAL LOG RECORD</p>
                <p style="margin: 0; font-size: 15px; font-weight: 900; color: #065F46; letter-spacing: 2px;">⬢ ENTRY RECORDED ⬢</p>
                <p style="margin: 6px 0 0; font-size: 11px; color: #047857; font-family: Consolas, monospace; font-weight: 700;">Scan ID: ${scanId}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `);

    const emailBody = `Hello ${request.name},\n\nYour vehicle has been successfully verified by Security.\n\nStatus: ✅ VERIFIED — ACCESS ALLOWED\n\nEntry Details:\n• Name: ${request.name}\n• Department: ${request.department}\n• Vehicle Number: ${request.bikeNumber}\n• QR ID: ${qrToken || request.token || 'N/A'}\n• Verified By: Security\n• Entry Date: ${dateStr}\n• Entry Time: ${timeStr}\n\nScan ID: ${scanId}\n\nMRF Vehicle Security — Smart Access Control System`;

    // ── 3. DISPATCH EMAIL & RECORD LOG ──
    const transportObj = await createTransporter();
    let nodemailerSuccess = true;
    let previewUrl = null;

    const notifyAdmin = process.env.NOTIFICATION_EMAIL || process.env.SECURITY_EMAIL;
    let targetRecipients = request.email;
    if (notifyAdmin && notifyAdmin !== request.email) {
      targetRecipients = `${request.email}, ${notifyAdmin}`;
    }

    if (transportObj && transportObj.transporter) {
      try {
        const info = await transportObj.transporter.sendMail({
          from: `"MRF Vehicle Security" <${transportObj.fromEmail}>`,
          to: targetRecipients,
          subject,
          text: emailBody,
          html: htmlBody
        });

        if (transportObj.isRealSmtp) {
          console.log(`✅ Nodemailer SMTP email delivered to ${targetRecipients}`);
        } else {
          previewUrl = nodemailer.getTestMessageUrl(info);
          console.log('----------------------------------------------------');
          console.log(`📧 VERIFICATION EMAIL DISPATCHED TO: ${targetRecipients}`);
          if (previewUrl) {
            console.log(`🔗 PREVIEW ONLINE EMAIL INBOX: ${previewUrl}`);
          }
          console.log('----------------------------------------------------');
        }
      } catch (e) {
        console.error(`❌ Nodemailer send failed to ${targetRecipients}:`, e.message);
        nodemailerSuccess = false;
      }
    }

    console.log('----------------------------------------------------');
    console.log(`📧 EMAIL LOGGED: Verification Success -> ${targetRecipients}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------------------------');

    // Update in-memory duplicate protection cache
    recentEmailScans.set(cacheKey, now.getTime());

    const logEntry = {
      request: request._id,
      email: request.email,
      qrToken: qrToken || request.token || 'N/A',
      scanId,
      emailType: 'Entry Verification',
      status: nodemailerSuccess ? 'Sent' : 'Failed',
      date: dateStr,
      time: timeStr,
      errorMessage: null,
      previewUrl
    };

    if (isDbConnected()) {
      await EmailLog.create(logEntry);
    }
    inMemoryEmailLogs.unshift(logEntry);

    return { sent: nodemailerSuccess, scanId, previewUrl, recipients: targetRecipients };

  } catch (err) {
    console.error(`❌ Email notification error for ${request.email}:`, err.message);

    const failLog = {
      request: request._id,
      email: request.email,
      qrToken: qrToken || request.token || 'N/A',
      scanId,
      emailType: 'Entry Verification',
      status: 'Failed',
      date: dateStr,
      time: timeStr,
      errorMessage: err.message
    };

    try {
      if (isDbConnected()) await EmailLog.create(failLog);
    } catch (_) {}
    inMemoryEmailLogs.unshift(failLog);

    return { sent: false, error: err.message };
  }
};

// ═══════════════════════════════════════════════════════════════════
// ██  4. DENIED SCAN SECURITY ALERT EMAIL
// ═══════════════════════════════════════════════════════════════════
export const sendScanAlertEmail = async (request, reason = 'ACCESS DENIED', qrToken = 'N/A', guardName = 'Gate Security Guard') => {
  const targetEmail = request?.email || process.env.NOTIFICATION_EMAIL || process.env.SECURITY_EMAIL || 'dsri_mccmrfip@mcc.edu.in';
  if (!targetEmail) return false;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const scanId  = `ALERT-${Date.now()}`;
  const subject = `⚠️ Security Alert: Access Denied — ${request?.bikeNumber || qrToken}`;

  const htmlBody = emailWrapper('#EF4444', `
    <tr>
      <td style="padding: 32px 40px 28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FEF2F2; border: 2px solid #EF4444; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 18px 24px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 26px; font-weight: 900; color: #DC2626; letter-spacing: 2px;">⚠️ ACCESS DENIED</p>
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #EF4444; letter-spacing: 2px;">REASON: ${reason.toUpperCase()}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="font-size: 15px; color: #334155; margin: 0 0 6px;">Security Scan Security Notice,</p>
        <p style="font-size: 14px; color: #64748B; margin: 0 0 24px; line-height: 1.7;">An unauthorized or denied vehicle scan attempt was detected at campus security checkpoint.</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFBFC; border-radius: 12px; border: 1px solid #FECACA; overflow: hidden; margin-bottom: 20px;">
          <tr>
            <td colspan="2" style="padding: 12px 16px; background-color: #FEF2F2; border-bottom: 2px solid #FECACA;">
              <strong style="color: #991B1B; font-size: 13px; letter-spacing: 0.5px;">🚨 ALERT METRICS</strong>
            </td>
          </tr>
          ${detailRow('🚗', 'Vehicle / Token', request?.bikeNumber || qrToken, '#991B1B', true, true)}
          ${detailRow('👤', 'Registered Name', request?.name || 'Unknown / Unregistered')}
          ${detailRow('📝', 'Denial Reason', reason, '#DC2626', true)}
          ${detailRow('📅', 'Scan Date', dateStr)}
          ${detailRow('⏰', 'Scan Time', timeStr, '#DC2626', true)}
        </table>
      </td>
    </tr>
  `);

  const textBody = `SECURITY ALERT: Access Denied for ${request?.bikeNumber || qrToken}.\nReason: ${reason}\nDate: ${dateStr} ${timeStr}\nScan ID: ${scanId}`;

  const transportObj = await createTransporter();
  let previewUrl = null;

  let attachments = [];
  const mccLogoAtt = getMccLogoAttachment();
  if (mccLogoAtt) attachments.push(mccLogoAtt);

  if (transportObj && transportObj.transporter) {
    try {
      const info = await transportObj.transporter.sendMail({
        from: `"MRF Vehicle Security Alert" <${transportObj.fromEmail}>`,
        to: targetEmail,
        subject,
        text: textBody,
        html: htmlBody,
        attachments
      });
      if (!transportObj.isRealSmtp) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`🔗 SECURITY ALERT PREVIEW EMAIL: ${previewUrl}`);
      }
    } catch (e) {
      console.error(`❌ Security alert mail failed to ${targetEmail}:`, e.message);
    }
  }

  return { sent: true, alert: true, previewUrl };
};

// ═══════════════════════════════════════════════════════════════════
// ██  5. STARTUP COMPANY OWNER APPROVAL EMAIL (Tier 1)
// ═══════════════════════════════════════════════════════════════════
export const sendStartupOwnerApprovalEmail = async (request) => {
  const baseUrl = process.env.BASE_URL || process.env.PUBLIC_URL || 'http://localhost:5000';

  const targetEmail = request.companyHeadEmail || 'frankin@techquora.com';
  const ownerName = request.companyHead || 'Mr. Franklin';
  const transportObj = await createTransporter();
  const transporter = transportObj ? transportObj.transporter : null;
  const tokenToUse = request.approvalToken || String(request._id || '').trim() || (request.bikeNumber ? request.bikeNumber.replace(/\s+/g, '') : '') || `REQ-${Date.now()}`;
  const approveUrl = `${baseUrl}/owner/approve?token=${encodeURIComponent(tokenToUse)}&action=approve&name=${encodeURIComponent(request.name || '')}&bike=${encodeURIComponent(request.bikeNumber || '')}&company=${encodeURIComponent(request.company || '')}`;
  const rejectUrl = `${baseUrl}/owner/approve?token=${encodeURIComponent(tokenToUse)}&action=reject&name=${encodeURIComponent(request.name || '')}&bike=${encodeURIComponent(request.bikeNumber || '')}&company=${encodeURIComponent(request.company || '')}`;
  const subject = `Action Required: Access Permit Approval for ${request.name} (${request.company})`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const htmlBody = emailWrapper('#701A1A', `
    <tr>
      <td style="padding: 32px 40px 28px;">
        <!-- ACTION REQUIRED BADGE -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #FFF5F5; border: 2px solid #701A1A; padding: 12px 36px; border-radius: 50px; text-align: center; box-shadow: 0 4px 14px rgba(112,26,26,0.12);">
                    <span style="color: #701A1A; font-size: 15px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">TIER-1 COMPANY OWNER APPROVAL REQUIRED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="font-size: 15px; color: #0F172A; margin: 16px 0 6px; font-weight: 700;">Dear <strong>${ownerName}</strong> (Owner / Head of ${request.company}),</p>
        <p style="font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.7; font-weight: 500;">
          An intern / employee registered under <strong>${request.company}</strong> has submitted a campus vehicle access pass request. Please review and verify their details to forward this request to Super Admin for final QR pass issuing.
        </p>

        <!-- APPLICANT DETAILS GRID -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFBFC; border-radius: 14px; border: 1px solid #E2E8F0; overflow: hidden; margin-bottom: 24px;">
          <tr>
            <td colspan="2" style="padding: 14px 18px; background-color: #FFF5F5; border-bottom: 2px solid #701A1A;">
              <strong style="color: #701A1A; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">INTERN / APPLICANT REGISTRATION PROFILE</strong>
            </td>
          </tr>
          ${detailRow('', 'Applicant Name', request.name, '#0F172A', true)}
          ${detailRow('', 'Email Address', request.email, '#0F172A')}
          ${detailRow('', 'Mobile Number', request.mobile || 'N/A', '#0F172A')}
          ${detailRow('', 'Vehicle Number', request.bikeNumber, '#0F172A', true, true)}
          ${detailRow('', 'Department / Course', request.department || 'N/A', '#0F172A')}
          ${detailRow('', 'Designation / Role', request.designation || 'Intern / Employee', '#0F172A')}
          ${detailRow('', 'Company Name', request.company, '#0F172A')}
          ${detailRow('', 'Submission Date', dateStr, '#0F172A')}
        </table>

        <!-- ACTION BUTTONS: APPROVE & REJECT -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <a href="${approveUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #701A1A, #5C121E); color: #ffffff; padding: 16px 52px; border-radius: 50px; font-size: 15px; font-weight: 900; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 6px 20px rgba(112, 26, 26, 0.4);">
                APPROVE ACCESS REQUEST
              </a>
            </td>
          </tr>
          <tr>
            <td align="center">
              <a href="${rejectUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #DC2626, #EF4444); color: #ffffff; padding: 14px 52px; border-radius: 50px; font-size: 14px; font-weight: 900; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);">
                REJECT REQUEST
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.6;">
          <strong>Approve</strong> → Request moves to Super Admin for final QR Gate Pass issuance.<br/>
          <strong>Reject</strong> → Request is denied and the applicant is notified.
        </p>
      </td>
    </tr>
  `);

  const textBody = `Dear ${ownerName},\n\nApproval request for ${request.name} (${request.company}).\nVehicle: ${request.bikeNumber}\nDepartment: ${request.department}\nDesignation: ${request.designation}\n\nPlease approve at: ${baseUrl}/admin/approval`;

  const notifyAdmin = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER;
  let recipients = targetEmail;
  if (notifyAdmin && notifyAdmin.toLowerCase() !== targetEmail.toLowerCase()) {
    recipients = `${targetEmail}, ${notifyAdmin}`;
  }

  let attachments = [];
  const mccLogoAtt = getMccLogoAttachment();
  if (mccLogoAtt) attachments.push(mccLogoAtt);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MRF Vehicle Security" <${transportObj.fromEmail}>`,
        to: targetEmail,
        replyTo: transportObj.fromEmail,
        headers: {
          'X-Priority': '1 (Highest)',
          'X-MSMail-Priority': 'High',
          'Importance': 'High'
        },
        subject,
        text: textBody,
        html: htmlBody,
        attachments
      });
      console.log(`✅ Tier-1 Company Owner approval email dispatched to ${targetEmail} (${ownerName}) via ${baseUrl}`);
    } catch (e) {
      console.error(`❌ Mail send error to ${targetEmail}:`, e.message);
    }
  }

  const logEntry = {
    request: request._id,
    email: targetEmail,
    qrToken: request.bikeNumber,
    scanId: `OWNER-MAIL-${Date.now()}`,
    emailType: 'Company Owner Approval Request',
    status: 'Sent',
    date: dateStr,
    time: new Date().toLocaleTimeString('en-IN'),
    errorMessage: null
  };

  if (isDbConnected()) {
    try {
      const EmailLog = (await import('../models/EmailLog.js')).default;
      await EmailLog.create(logEntry);
    } catch (_) {}
  }
  inMemoryEmailLogs.unshift(logEntry);

  return true;
};

// ═══════════════════════════════════════════════════════════════════
// ██  6. SUPER ADMIN TIER-1 APPROVAL NOTICE EMAIL
// ═══════════════════════════════════════════════════════════════════
export const sendSuperAdminApprovalNotice = async (request) => {
  const baseUrl = process.env.PUBLIC_URL || process.env.BASE_URL || 'https://smart-vehicle-access-control-system.mccmrfip.in';
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || 'dsri_mccmrfip@mcc.edu.in';
  const transportObj = await createTransporter();
  const transporter = transportObj ? transportObj.transporter : null;
  const subject = `🟢 Tier-1 Approval Granted: Access Pass Request for ${request.name} (${request.company})`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const htmlBody = emailWrapper('#059669', `
    <tr>
      <td style="padding: 32px 40px 28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <span style="background-color: #ECFDF5; border: 2px solid #059669; color: #059669; padding: 10px 32px; border-radius: 50px; font-size: 14px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">TIER-1 APPROVAL COMPLETED BY COMPANY OWNER</span>
            </td>
          </tr>
        </table>

        <p style="font-size: 15px; color: #0F172A; margin: 16px 0 6px; font-weight: 700;">Dear Super Admin,</p>
        <p style="font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.7; font-weight: 500;">
          The vehicle access pass request for <strong>${request.name}</strong> (${request.bikeNumber} &bull; <strong>${request.company || 'Startup'}</strong>) has been <strong>APPROVED by Company Owner / Management (${request.companyHead || 'Owner'})</strong>. It is now forwarded to you for final Super Admin Approval & Gate Pass issuance.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFBFC; border-radius: 14px; border: 1px solid #E2E8F0; overflow: hidden; margin-bottom: 24px;">
          ${detailRow('', 'Applicant Name', request.name, '#0F172A', true)}
          ${detailRow('', 'Vehicle Number', request.bikeNumber, '#0F172A', true, true)}
          ${detailRow('', 'Company Name', request.company || 'Startup', '#0F172A')}
          ${detailRow('', 'Owner Approval Date', dateStr, '#0F172A')}
          ${detailRow('', 'Status', 'Pending Super Admin Approval', '#D97706', true)}
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
          <tr>
            <td align="center">
              <a href="${baseUrl}/admin/approval" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0F172A, #1E293B); color: #ffffff; padding: 16px 52px; border-radius: 50px; font-size: 15px; font-weight: 900; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 6px 20px rgba(15, 23, 42, 0.4);">
                OPEN APPROVAL DASHBOARD
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MRF Vehicle Security" <${transportObj.fromEmail}>`,
        to: superAdminEmail,
        subject,
        html: htmlBody,
        attachments: getMccLogoAttachment() ? [getMccLogoAttachment()] : []
      });
      console.log(`✅ Super Admin approval notice dispatched to ${superAdminEmail}`);
    } catch (e) {
      console.error(`❌ Mail send error to ${superAdminEmail}:`, e.message);
    }
  }
  return true;
};


