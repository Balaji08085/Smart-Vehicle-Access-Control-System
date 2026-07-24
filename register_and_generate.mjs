import QRCode from 'qrcode';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'backend', 'database.json');

// --- HOW TO USE ---
// Run this script to add a new vehicle to the database AND generate its QR code.
// Example command: node register_and_generate.mjs

// Read database to determine next SVACS ID
let db = { vehicles: {} };
if (existsSync(DB_FILE)) {
  db = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
}

const svacsIds = Object.keys(db.vehicles || {})
  .filter(id => id.startsWith('SVACS-'))
  .map(id => parseInt(id.replace('SVACS-', ''), 10))
  .filter(num => !isNaN(num));

const nextNum = svacsIds.length > 0 ? Math.max(...svacsIds) + 1 : 1;
const formattedId = `SVACS-${nextNum.toString().padStart(6, '0')}`;

const newVehicle = {
  id: formattedId,
  qrCode: formattedId, // The QR Code will now ONLY encode the unique SVACS ID
  type: "Staff",
  name: "Dr. Vikram Singh",
  registerId: "EMP-NEW-888",
  department: "Security",
  vehicleNumber: "TN 14 XX 9999",
  vehicleType: "Car",
  brand: "Toyota Innova",
  status: "Active", // Must be 'Active' for verification to pass
  issueDate: "2026-07-24",
  expiryDate: "2030-12-31"
};

// 1. Add to database.json
if (existsSync(DB_FILE)) {
  if (!db.vehicles) db.vehicles = {};
  
  // Add or update the vehicle
  db.vehicles[newVehicle.id] = newVehicle;
  
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  console.log(`✅ Successfully saved ${newVehicle.id} to backend/database.json`);
} else {
  console.error('❌ database.json not found! Start the backend server first.');
  process.exit(1);
}

// 2. Generate QR Code
async function generateQR() {
  const dataUrl = await QRCode.toDataURL(newVehicle.qrCode, { 
    errorCorrectionLevel: 'H', // High error correction for robust scanning
    margin: 4,                 // Standard margin
    scale: 10,                 // High resolution
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  const base64 = dataUrl.split(',')[1];
  const buf = Buffer.from(base64, 'base64');
  const filename = `test_qr_${newVehicle.id.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  
  writeFileSync(filename, buf);
  console.log(`✅ Successfully generated QR Code image: ${filename}`);
}

generateQR();
