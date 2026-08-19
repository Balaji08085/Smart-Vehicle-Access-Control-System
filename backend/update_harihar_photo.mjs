import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const hariharB64 = fs.readFileSync(path.resolve(process.cwd(), '../harihar_b64.txt'), 'utf-8').trim();

console.log(`Loaded base64 photo for Harihar SK (length: ${hariharB64.length})`);

// 1. Update root requests_db.json
const rootDbPath = path.resolve(process.cwd(), '../requests_db.json');
if (fs.existsSync(rootDbPath)) {
  const rootDb = JSON.parse(fs.readFileSync(rootDbPath, 'utf-8'));
  for (const item of rootDb) {
    if (item.name && (item.name.includes('Harihar') || item.bikeNumber === 'TN 10 BC 2115' || item.email === 'hariharsk1006@gmail.com')) {
      item.photoUrl = hariharB64;
      item.photo = hariharB64;
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
    if (item.name && (item.name.includes('Harihar') || item.bikeNumber === 'TN 10 BC 2115' || item.email === 'hariharsk1006@gmail.com')) {
      item.photoUrl = hariharB64;
      item.photo = hariharB64;
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
    { $or: [{ name: /Harihar/i }, { bikeNumber: 'TN 10 BC 2115' }, { email: 'hariharsk1006@gmail.com' }] },
    { $set: { photoUrl: hariharB64, photo: hariharB64 } }
  );
  console.log(`✅ Updated MongoDB accessrequests: modified ${res.modifiedCount}`);
  process.exit(0);
}

updateMongo().catch(err => {
  console.error('Mongo update error:', err);
  process.exit(1);
});
