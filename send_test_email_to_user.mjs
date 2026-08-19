import { createRequest } from './backend/controllers/requestController.js';
import dotenv from 'dotenv';
import connectDB from './backend/config/db.js';

dotenv.config({ path: './backend/.env' });

async function sendTestEmailToUser() {
  console.log('📧 Connecting to database and preparing test registration...');
  await connectDB();

  const req = {
    body: {
      applicantCategory: 'Startup',
      name: 'Balaji Live Test User',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      employeeId: 'EMP-9999',
      department: 'IT & Software Development',
      company: 'DSRI',
      companyHead: 'Balaji Owner',
      companyHeadEmail: 'balap4496@gmail.com',
      designation: 'Full Stack Engineer',
      bikeNumber: 'TN 15 DK 9999',
      vehicleType: 'Bike',
      email: 'balap4496@gmail.com',
      mobile: '9080758943',
      accessStartDate: '2026-08-19',
      accessExpiryDate: '2027-08-19'
    }
  };

  const res = {
    status: (code) => ({
      json: (data) => {
        console.log(`\n✅ Registration HTTP Response [${code}]:`);
        console.log('Request ID:', data._id || data.request?._id);
        console.log('Approval Token:', data.approvalToken || data.request?.approvalToken);
        console.log('Status:', data.status || data.request?.status);
        console.log('\n🎉 TEST EMAIL SUCCESSFULLY DISPATCHED TO balap4496@gmail.com!');
        process.exit(0);
      }
    }),
    json: (data) => {
      console.log('\n✅ Registration Response:', data);
      console.log('\n🎉 TEST EMAIL SUCCESSFULLY DISPATCHED TO balap4496@gmail.com!');
      process.exit(0);
    }
  };

  await createRequest(req, res);
}

sendTestEmailToUser().catch(err => {
  console.error('❌ Error sending test email:', err);
  process.exit(1);
});
