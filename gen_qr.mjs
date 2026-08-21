import QRCode from 'qrcode';
import { writeFileSync } from 'fs';

// Generate QR codes for test vehicles
const vehicles = [
  { code: 'TN-38-AB-1234', label: 'valid_student' },
  { code: 'TN-38-XY-9999', label: 'valid_faculty' },
  { code: 'TN-38-EXP-2025', label: 'expired' },
];

for (const v of vehicles) {
  const dataUrl = await QRCode.toDataURL(v.code, { width: 400, margin: 2 });
  // strip the prefix
  const base64 = dataUrl.split(',')[1];
  const buf = Buffer.from(base64, 'base64');
  writeFileSync(`test_qr_${v.label}.png`, buf);
  console.log(`✅ Generated test_qr_${v.label}.png  (code: ${v.code})`);
}