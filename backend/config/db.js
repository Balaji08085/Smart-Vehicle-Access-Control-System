import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is missing from environment variables (.env).');
    console.warn('⚠️ Server will run in API standalone mode until MONGO_URI is configured.');
    return;
  }

  if (uri.includes('example.mongodb.net') || uri.includes('<username>')) {
    console.warn('⚠️ MONGO_URI in .env contains default placeholder credentials.');
    console.warn('⚠️ Server will run in standalone mode until real MongoDB credentials are set.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    setTimeout(async () => {
      try {
        const { syncDiskRequestsToMongo } = await import('../controllers/requestController.js');
        await syncDiskRequestsToMongo();
      } catch (e) {
        console.warn('Sync error:', e.message);
      }
    }, 500);
  } catch (error) {
    console.error(`⚠️ MongoDB connection error: ${error.message}`);
    console.warn('⚠️ Express server is running in API standalone mode.');
  }
};

export default connectDB;


