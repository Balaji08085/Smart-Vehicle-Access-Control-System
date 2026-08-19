import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const approvedReqs = await db.collection('accessrequests').find({ status: 'Approved' }).toArray();
  console.log(`Found ${approvedReqs.length} approved access requests in MongoDB.`);

  for (const req of approvedReqs) {
    const res = await db.collection('qrcodes').updateMany(
      { $or: [{ request: req._id }, { token: req.token }, { token: req.bikeNumber }] },
      { $set: { isValid: true } }
    );
    console.log(`Updated QRCodes for ${req.name} (${req.bikeNumber}): modified ${res.modifiedCount}`);
  }

  // Also ensure SAJIN DEVESH and HARIHAR SK have active approved records
  const sajinReq = await db.collection('accessrequests').findOne({ bikeNumber: 'TN 11 BV 3595' });
  if (sajinReq) {
    await db.collection('accessrequests').updateOne({ _id: sajinReq._id }, { $set: { status: 'Approved' } });
    await db.collection('qrcodes').updateMany({ request: sajinReq._id }, { $set: { isValid: true } });
  }

  console.log('✅ MongoDB sync complete!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
