import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const sajinReq = await db.collection('accessrequests').findOne({ 
    $or: [{ name: /SAJIN/i }, { bikeNumber: 'TN 11 BV 3595' }, { email: 'sajindevesh0@gmail.com' }] 
  });

  if (sajinReq) {
    await db.collection('qrcodes').updateOne(
      { token: 'BIKE-2026-000105-40A9607B' },
      { 
        $set: { 
          token: 'BIKE-2026-000105-40A9607B',
          request: sajinReq._id,
          isValid: true,
          qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http%3A%2F%2Flocalhost%3A5174%2Fverify%2FBIKE-2026-000105-40A9607B`,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
    console.log('✅ Added BIKE-2026-000105-40A9607B token mapping for SAJIN DEVESH to MongoDB qrcodes!');
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
