import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const reqs = await db.collection('accessrequests').find({
    $or: [{ name: /SAJIN/i }, { bikeNumber: /3595/i }, { email: 'sajindevesh0@gmail.com' }]
  }).toArray();

  console.log('=== MONGO SAJIN REQUESTS ===');
  console.log(JSON.stringify(reqs, null, 2));

  const qrs = await db.collection('qrcodes').find({
    $or: [{ token: /3595/i }, { token: /000886/i }, { token: /000105/i }, { request: { $in: reqs.map(r => r._id) } }]
  }).toArray();

  console.log('\n=== MONGO SAJIN QR CODES ===');
  console.log(JSON.stringify(qrs, null, 2));

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
