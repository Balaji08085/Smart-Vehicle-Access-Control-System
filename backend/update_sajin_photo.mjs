import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const sajinB64 = fs.readFileSync(path.resolve(process.cwd(), '../sajin_b64.txt'), 'utf-8').trim();

console.log(`Loaded base64 photo for SAJIN DEVESH (length: ${sajinB64.length})`);

// 1. Update root requests_db.json
const rootDbPath = path.resolve(process.cwd(), '../requests_db.json');
if (fs.existsSync(rootDbPath)) {
  const rootDb = JSON.parse(fs.readFileSync(rootDbPath, 'utf-8'));
  for (const item of rootDb) {
    if (item.name && item.name.includes('SAJIN')) {
      item.photoUrl = sajinB64;
      item.photo = sajinB64;
    }
  }
  fs.writeFileSync(rootDbPath, JSON.stringify(rootDb, null, 2), 'utf-8');
  console.log('✅ Updated root requests_db.json');
}

// 2. Update backend requests_db.json
const backendDbPath = path.resolve(process.cwd(), 'requests_db.json');
if (fs.existsSync(backendDbPath)) {
  const backendDb = JSON.parse(fs.readFileSync(backendDbPath, 'utf-8'));
  for (const item of backendDb) {
    if (item.name && item.name.includes('SAJIN')) {
      item.photoUrl = sajinB64;
      item.photo = sajinB64;
    }
  }
  fs.writeFileSync(backendDbPath, JSON.stringify(backendDb, null, 2), 'utf-8');
  console.log('✅ Updated backend requests_db.json');
}

// 3. Update MongoDB
async function updateMongo() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const res = await db.collection('accessrequests').updateMany(
    { $or: [{ name: /SAJIN/i }, { bikeNumber: 'TN 11 BV 3595' }, { email: 'sajindevesh0@gmail.com' }] },
    { $set: { photoUrl: sajinB64, photo: sajinB64 } }
  );
  console.log(`✅ Updated MongoDB accessrequests: modified ${res.modifiedCount}`);
  process.exit(0);
}

updateMongo().catch(err => {
  console.error('Mongo update error:', err);
  process.exit(1);
});
