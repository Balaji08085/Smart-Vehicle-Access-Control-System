import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mcc_secure_jwt_secret_key_987654321';
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());

// Seed data
const INITIAL_VEHICLES = {
  'TN-38-AB-1234': {
    id: 'TN-38-AB-1234',
    qrCode: 'TN-38-AB-1234',
    type: 'Student',
    name: 'Balaji S',
    registerId: '23BCS045',
    department: 'Computer Science & Engineering',
    vehicleNumber: 'TN 38 AB 1234',
    vehicleType: 'Bike (Two-Wheeler)',
    brand: 'Royal Enfield Hunter 350',
    status: 'Active',
    issueDate: '2024-01-10',
    expiryDate: '2027-12-31',
    mobile: '+91 98765 43210',
    email: 'balaji.s@college.edu',
    photo: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80',
    vehicleDetails: { number: 'TN 38 AB 1234', type: 'Bike', brand: 'Royal Enfield' },
  },
  'TN-38-XY-9999': {
    id: 'TN-38-XY-9999',
    qrCode: 'TN-38-XY-9999',
    type: 'Faculty',
    name: 'Dr. Ramesh Kumar',
    registerId: 'EMP9023',
    department: 'Mechanical Engineering',
    vehicleNumber: 'TN 38 XY 9999',
    vehicleType: 'Car (Four-Wheeler)',
    brand: 'Honda City i-VTEC',
    status: 'Active',
    issueDate: '2021-06-15',
    expiryDate: '2030-06-15',
    mobile: '+91 98765 11111',
    email: 'ramesh.k@college.edu',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    vehicleDetails: { number: 'TN 38 XY 9999', type: 'Car', brand: 'Honda City' },
  },
  'TN-38-CC-5555': {
    id: 'TN-38-CC-5555',
    qrCode: 'TN-38-CC-5555',
    type: 'Staff',
    name: 'Suresh Menon',
    registerId: 'ADM405',
    department: 'Administration & Finance',
    vehicleNumber: 'TN 38 CC 5555',
    vehicleType: 'Bike (Two-Wheeler)',
    brand: 'TVS Jupiter 125',
    status: 'Active',
    issueDate: '2019-01-10',
    expiryDate: '2026-12-31',
    mobile: '+91 98765 22222',
    email: 'suresh.m@college.edu',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    vehicleDetails: { number: 'TN 38 CC 5555', type: 'Bike', brand: 'TVS Jupiter' },
  },
  'TN-38-EXP-2025': {
    id: 'TN-38-EXP-2025',
    qrCode: 'TN-38-EXP-2025',
    type: 'Student',
    name: 'Vikram T',
    registerId: '21BME102',
    department: 'Mechanical Engineering',
    vehicleNumber: 'TN 38 EXP 2025',
    vehicleType: 'Bike (Two-Wheeler)',
    brand: 'Yamaha FZ-S',
    status: 'Expired',
    issueDate: '2021-08-01',
    expiryDate: '2025-01-01',
    mobile: '+91 98765 33333',
    email: 'vikram.t@college.edu',
    photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80',
    vehicleDetails: { number: 'TN 38 EXP 2025', type: 'Bike', brand: 'Yamaha FZ' },
  },
  'TN-38-ZZZ-999': {
    id: 'TN-38-ZZZ-999',
    qrCode: 'TN-38-ZZZ-999',
    type: 'Visitor',
    name: 'Rohan Malhotra',
    registerId: 'VIS8902',
    department: 'Outsourcing Partner',
    vehicleNumber: 'TN 38 ZZZ 999',
    vehicleType: 'Bike (Two-Wheeler)',
    brand: 'Hero Splendor Plus',
    status: 'Blacklisted',
    issueDate: '2026-06-01',
    expiryDate: '2026-06-02',
    mobile: '+91 98765 44444',
    email: 'rohan.m@gmail.com',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
    vehicleDetails: { number: 'TN 38 ZZZ 999', type: 'Bike', brand: 'Hero Splendor' },
  }
};

const INITIAL_HISTORY = [
  {
    id: 'LOG-101',
    date: new Date().toLocaleDateString(),
    time: '09:12 AM',
    vehicleNumber: 'TN 38 AB 1234',
    ownerName: 'Balaji S',
    registerId: '23BCS045',
    department: 'Computer Science & Engineering',
    vehicleType: 'Bike (Two-Wheeler)',
    gate: 'Main Entrance Gate',
    status: 'Granted',
    reason: '',
  },
  {
    id: 'LOG-102',
    date: new Date().toLocaleDateString(),
    time: '08:30 AM',
    vehicleNumber: 'TN 38 XY 9999',
    ownerName: 'Dr. Ramesh Kumar',
    registerId: 'EMP9023',
    department: 'Mechanical Engineering',
    vehicleType: 'Car (Four-Wheeler)',
    gate: 'Main Entrance Gate',
    status: 'Granted',
    reason: '',
  },
  {
    id: 'LOG-103',
    date: new Date().toLocaleDateString(),
    time: '08:15 AM',
    vehicleNumber: 'TN 38 ZZZ 999',
    ownerName: 'Rohan Malhotra',
    registerId: 'VIS8902',
    department: 'Outsourcing Partner',
    vehicleType: 'Bike (Two-Wheeler)',
    gate: 'Main Entrance Gate',
    status: 'Denied',
    reason: 'Blacklisted Vehicle',
  }
];

// Helper functions for reading/writing persistent database file
const readDatabase = () => {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = { vehicles: INITIAL_VEHICLES, history: INITIAL_HISTORY };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading JSON DB file, returning defaults', err);
    return { vehicles: INITIAL_VEHICLES, history: INITIAL_HISTORY };
  }
};

const writeDatabase = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to JSON DB file', err);
  }
};

// Date calculation helpers
const getDaysRemaining = (expiryDateStr) => {
  if (!expiryDateStr) return Infinity; // Default to never expiring if no expiry date provided
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getValidityStatus = (vehicle) => {
  if (!vehicle) return 'Not Registered';
  if (vehicle.status === 'Suspended') return 'Suspended';
  if (vehicle.status === 'Blacklisted') return 'Blacklisted';
  if (vehicle.status === 'Disabled') return 'Disabled';
  const days = getDaysRemaining(vehicle.expiryDate);
  if (days <= 0) return 'Expired';
  return 'Active';
};

// JWT auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    req.user = user;
    next();
  });
};

// ── Auth Endpoints ──────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { role, guardId, guardPin, adminEmail, adminPassword } = req.body;

  if (role === 'guard') {
    if (guardId === 'SEC-GATE-01' && guardPin === '1234') {
      const token = jwt.sign({ role: 'guard', id: guardId }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, role: 'guard' });
    }
    return res.status(400).json({ error: 'Invalid Guard ID or Passcode PIN' });
  }

  if (role === 'admin') {
    // Allows demo bypass with default admin credentials
    if (adminEmail === 'admin@college.edu' && (adminPassword === 'admin123' || adminPassword === '••••••••')) {
      const token = jwt.sign({ role: 'admin', email: adminEmail }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, role: 'admin' });
    }
    return res.status(400).json({ error: 'Invalid Admin Email or Password' });
  }

  // Fallback for public student check mode
  if (role === 'student') {
    const token = jwt.sign({ role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, role: 'student' });
  }

  return res.status(400).json({ error: 'Invalid authentication role' });
});

// ── QR Scanner Verification Endpoint ────────────────
app.post('/api/verify', (req, res) => {
  const { scannedQuery, gateName } = req.body;
  const rawInput = (scannedQuery || '').trim();

  const now = new Date();
  const nowTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const nowDate = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  const db = readDatabase();

  if (!rawInput) {
    return res.json({
      status: 'DENIED',
      resultType: 'REJECTED',
      reason: 'QR Code Not Registered',
      vehicleNumber: 'UNKNOWN',
      ownerName: 'Unknown Visitor',
      registerId: 'N/A',
      department: 'N/A',
      vehicleType: 'N/A',
      stickerStatus: 'INVALID',
      expiryDate: 'N/A',
      gateEntryTime: nowTime,
      gate: gateName || 'Main Entrance Gate',
    });
  }

  // Robust QR Code payload parsing (handles raw strings, URLs, and JSON QR payloads)
  let parsedSearchTerms = [rawInput.replace(/[^a-z0-9]/gi, '').toLowerCase()];

  try {
    if (rawInput.startsWith('{') && rawInput.endsWith('}')) {
      const jsonObj = JSON.parse(rawInput);
      const fields = [jsonObj.plate, jsonObj.vehicleNumber, jsonObj.registerId, jsonObj.id, jsonObj.code, jsonObj.qrCode, jsonObj.name];
      fields.forEach(f => {
        if (f && typeof f === 'string') {
          parsedSearchTerms.push(f.replace(/[^a-z0-9]/gi, '').toLowerCase());
        }
      });
    }
  } catch (jsonErr) {}

  if (rawInput.includes('http')) {
    try {
      const url = new URL(rawInput);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        parsedSearchTerms.push(pathSegments[pathSegments.length - 1].replace(/[^a-z0-9]/gi, '').toLowerCase());
      }
    } catch (urlErr) {}
  }

  // Database search by QR, Vehicle Plate, ID, etc.
  const targetKey = Object.keys(db.vehicles).find((key) => {
    const v = db.vehicles[key];
    const vFields = [
      v.qrCode,
      v.vehicleNumber,
      v.registerId,
      v.id,
      v.name
    ].filter(Boolean).map(val => val.replace(/[^a-z0-9]/gi, '').toLowerCase());

    return parsedSearchTerms.some(term => vFields.some(fieldVal => fieldVal === term || (term.length >= 4 && fieldVal.includes(term))));
  });

  const matchedVehicle = targetKey ? db.vehicles[targetKey] : null;

  if (!matchedVehicle) {
    console.log(`[VERIFY] NO MATCH FOUND for terms:`, parsedSearchTerms);
    const denialReason = 'QR Code Not Registered';
    const deniedResult = {
      status: 'DENIED',
      resultType: 'REJECTED',
      reason: denialReason,
      vehicleNumber: rawInput.slice(0, 15) || 'UNKNOWN',
      ownerName: 'Unknown Visitor',
      registerId: 'N/A',
      department: 'N/A',
      vehicleType: 'N/A',
      stickerStatus: 'INVALID',
      expiryDate: 'N/A',
      gateEntryTime: nowTime,
      gate: gateName || 'Main Entrance Gate'
    };

    db.history.unshift({
      id: `LOG-${Date.now()}`,
      date: nowDate,
      time: nowTime,
      vehicleNumber: deniedResult.vehicleNumber,
      ownerName: deniedResult.ownerName,
      registerId: deniedResult.registerId,
      department: deniedResult.department,
      vehicleType: deniedResult.vehicleType,
      gate: deniedResult.gate,
      status: 'Denied',
      reason: denialReason,
    });

    writeDatabase(db);
    return res.json(deniedResult);
  }

  console.log(`[VERIFY] Matched DB ID: "${matchedVehicle.id}"`);
  
  let finalVehicle = matchedVehicle;

  // Found match in database - compute status
  const computedStatus = getValidityStatus(finalVehicle);

  if (computedStatus === 'Active') {
    console.log(`[VERIFY] Scan Received: "${rawInput}"`);
    console.log(`[VERIFY] Matched DB ID: "${finalVehicle.id}"`);
    console.log(`[VERIFY] Result: GRANTED`);

    const grantedResult = {
      status: 'GRANTED',
      resultType: 'APPROVED',
      reason: '',
      vehicleNumber: finalVehicle.vehicleNumber || finalVehicle.id,
      ownerName: finalVehicle.name,
      registerId: finalVehicle.registerId,
      department: finalVehicle.department,
      vehicleType: finalVehicle.vehicleType || 'Two-Wheeler',
      stickerStatus: 'VALID',
      issueDate: finalVehicle.issueDate,
      expiryDate: finalVehicle.expiryDate,
      gateEntryTime: nowTime,
      gate: gateName || 'Main Entrance Gate',
      vehicle: finalVehicle
    };

    // Log to entry history database
    db.history.unshift({
      id: `LOG-${Date.now()}`,
      date: nowDate,
      time: nowTime,
      vehicleNumber: finalVehicle.vehicleNumber || finalVehicle.id,
      ownerName: finalVehicle.name,
      registerId: finalVehicle.registerId,
      department: finalVehicle.department,
      vehicleType: finalVehicle.vehicleType || 'Vehicle',
      gate: gateName || 'Main Entrance Gate',
      status: 'Granted',
      reason: '',
    });

    writeDatabase(db);
    return res.json(grantedResult);
  } else {
    let denialReason = 'Sticker Expired';
    if (computedStatus === 'Blacklisted') denialReason = 'Blacklisted Vehicle';
    else if (computedStatus === 'Suspended' || computedStatus === 'Disabled') denialReason = 'Sticker Disabled';

    console.log(`[VERIFY] Scan Received: "${rawInput}"`);
    console.log(`[VERIFY] Matched DB ID: "${finalVehicle.id}"`);
    console.log(`[VERIFY] Result: DENIED (Reason: ${denialReason})`);

    const deniedResult = {
      status: 'DENIED',
      resultType: 'REJECTED',
      reason: denialReason,
      vehicleNumber: finalVehicle.vehicleNumber || finalVehicle.id,
      ownerName: finalVehicle.name,
      registerId: finalVehicle.registerId,
      department: finalVehicle.department,
      vehicleType: finalVehicle.vehicleType || 'Vehicle',
      stickerStatus: computedStatus.toUpperCase(),
      issueDate: finalVehicle.issueDate,
      expiryDate: finalVehicle.expiryDate,
      gateEntryTime: nowTime,
      gate: gateName || 'Main Entrance Gate',
      vehicle: finalVehicle
    };

    db.history.unshift({
      id: `LOG-${Date.now()}`,
      date: nowDate,
      time: nowTime,
      vehicleNumber: finalVehicle.vehicleNumber || finalVehicle.id,
      ownerName: finalVehicle.name,
      registerId: finalVehicle.registerId,
      department: finalVehicle.department,
      vehicleType: finalVehicle.vehicleType || 'Vehicle',
      gate: gateName || 'Main Entrance Gate',
      status: 'Denied',
      reason: denialReason,
    });

    writeDatabase(db);
    return res.json(deniedResult);
  }
});

// ── CRUD Vehicle Management API endpoints ──────────
app.get('/api/vehicles', authenticateToken, (req, res) => {
  const db = readDatabase();
  res.json({ vehicles: db.vehicles, history: db.history });
});

app.post('/api/vehicles', (req, res) => {
  const newVehicle = req.body;
  const db = readDatabase();
  
  let formattedId = newVehicle.id;
  if (!formattedId) {
    // Generate SVACS-XXXXXX ID if not provided by frontend
    const svacsIds = Object.keys(db.vehicles)
      .filter(id => id.startsWith('SVACS-'))
      .map(id => parseInt(id.replace('SVACS-', ''), 10))
      .filter(num => !isNaN(num));
    
    const nextNum = svacsIds.length > 0 ? Math.max(...svacsIds) + 1 : 1;
    formattedId = `SVACS-${nextNum.toString().padStart(6, '0')}`;
  }
  
  // Default expiry date to 10 years in the future if missing
  const defaultExpiryDate = new Date();
  defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 10);

  const vehicleRecord = {
    id: formattedId,
    qrCode: formattedId,
    status: 'Active',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: newVehicle.expiryDate || defaultExpiryDate.toISOString().split('T')[0],
    createdAt: Date.now(),
    photo: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
    ...newVehicle // the frontend payload overrides the defaults
  };

  db.vehicles = { [formattedId]: vehicleRecord, ...db.vehicles };
  writeDatabase(db);

  res.json(vehicleRecord);
});

app.put('/api/vehicles/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { id } = req.params;
  const updatedData = req.body;
  const db = readDatabase();

  if (!db.vehicles[id]) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  db.vehicles[id] = { ...db.vehicles[id], ...updatedData };
  writeDatabase(db);

  res.json(db.vehicles[id]);
});

app.delete('/api/vehicles/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { id } = req.params;
  const db = readDatabase();

  if (!db.vehicles[id]) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  delete db.vehicles[id];
  writeDatabase(db);

  res.json({ message: 'Vehicle deleted successfully', id });
});

// Database reset
app.post('/api/reset', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  const defaultData = { vehicles: INITIAL_VEHICLES, history: INITIAL_HISTORY };
  writeDatabase(defaultData);
  res.json({ message: 'Database reset successfully' });
});

app.listen(PORT, () => {
  console.log(`🚀 Secure access control server running on http://localhost:${PORT}`);
});
