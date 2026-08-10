import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import Vehicle from './models/Vehicle.js';
import History from './models/History.js';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI || !MONGO_URI.includes('mongodb')) {
  console.log('❌ Please add your MONGO_URI to .env first!');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Read the existing JSON file
    if (!fs.existsSync('./database.json')) {
      console.log('❌ database.json not found. Nothing to migrate.');
      process.exit(1);
    }

    const rawData = fs.readFileSync('./database.json', 'utf-8');
    const data = JSON.parse(rawData);

    // Seed Vehicles
    if (data.vehicles) {
      console.log('Migrating vehicles...');
      const vehicleKeys = Object.keys(data.vehicles);
      for (const key of vehicleKeys) {
        const v = data.vehicles[key];
        // Check if it already exists to avoid duplicate key errors
        const exists = await Vehicle.findOne({ id: v.id });
        if (!exists) {
          const newV = new Vehicle(v);
          await newV.save();
          console.log(`  + Added vehicle: ${v.id}`);
        } else {
          console.log(`  - Skipped vehicle (already exists): ${v.id}`);
        }
      }
    }

    // Seed History
    if (data.history && data.history.length > 0) {
      console.log('Migrating history...');
      for (const h of data.history) {
        const exists = await History.findOne({ id: h.id });
        if (!exists) {
          const newH = new History(h);
          await newH.save();
          console.log(`  + Added history log: ${h.id}`);
        } else {
          console.log(`  - Skipped history log (already exists): ${h.id}`);
        }
      }
    }

    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
};

seedDatabase();
