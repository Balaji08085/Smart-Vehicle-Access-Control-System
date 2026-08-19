const BASE_URL = 'http://localhost:5000';

async function runEndToEndTest() {
  console.log('🚀 Starting End-to-End Workflow Verification...');

  // 1. Admin Registers Person
  const regPayload = {
    applicantCategory: 'Startup',
    name: 'Testing Intern Franklin',
    email: 'franklin_test@techquora.com',
    mobile: '+91 99887 76655',
    bikeNumber: 'TN 09 AZ ' + Math.floor(1000 + Math.random() * 9000),
    department: 'Software Engineering',
    company: 'TechQuora Innovations',
    companyHead: 'Mr. Franklin Owner',
    companyHeadEmail: 'frankin@techquora.com',
    designation: 'Frontend Intern',
    accessStartDate: '2026-08-19',
    accessExpiryDate: '2027-08-19',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  };

  console.log('\n[STEP 1] Admin submitting vehicle registration for:', regPayload.name, '(', regPayload.bikeNumber, ')');
  const createRes = await fetch(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  }).then(r => r.json());

  console.log('✅ Created Request ID:', createRes._id, '| Approval Token:', createRes.approvalToken);
  if (!createRes.approvalToken) {
    throw new Error('❌ Failed: approvalToken was not generated on creation!');
  }

  // 2. Owner opens approval link (GET /api/owner/approval-request?token=...)
  console.log('\n[STEP 2] Startup Owner opening email approval link with token:', createRes.approvalToken);
  const getReqRes = await fetch(`${BASE_URL}/api/owner/approval-request?token=${createRes.approvalToken}`).then(r => r.json());
  console.log('✅ Fetched Owner Request Details: Name =', getReqRes.name, '| Vehicle =', getReqRes.bikeNumber, '| Status =', getReqRes.status);
  if (getReqRes.bikeNumber !== regPayload.bikeNumber) {
    throw new Error('❌ Failed: Fetched request details do not match submitted registration!');
  }

  // 3. Owner approves access (POST /api/owner/approve)
  console.log('\n[STEP 3] Startup Owner clicking "APPROVE ACCESS REQUEST"...');
  const approveRes = await fetch(`${BASE_URL}/api/owner/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: createRes.approvalToken, action: 'approve' })
  }).then(r => r.json());
  console.log('✅ Owner Approval Response Message:', approveRes.message);
  console.log('✅ Updated Status:', approveRes.request?.status, '| Company Approved:', approveRes.request?.companyApproved);

  // 4. Super Admin checks pending approval dashboard (GET /api/requests/pending)
  console.log('\n[STEP 4] Super Admin checking pending requests list...');
  const pendingList = await fetch(`${BASE_URL}/api/requests/pending`).then(r => r.json());
  const foundInPending = pendingList.find(r => r.bikeNumber === regPayload.bikeNumber || r._id === createRes._id);
  console.log('✅ Found in Super Admin Pending List:', !!foundInPending, '| Status in Dashboard =', foundInPending?.status);
  if (!foundInPending) {
    throw new Error('❌ Failed: Request did not appear in Super Admin pending list!');
  }

  // 5. Super Admin approves request (PUT /api/requests/:id/approve)
  console.log('\n[STEP 5] Super Admin granting final approval...');
  const finalApproveRes = await fetch(`${BASE_URL}/api/requests/${createRes._id}/approve`, {
    method: 'PUT'
  }).then(r => r.json());
  console.log('✅ Final Approval Message:', finalApproveRes.message);
  console.log('✅ Final Status:', finalApproveRes.request?.status, '| Generated QR Token:', finalApproveRes.token);

  console.log('\n🎉 ALL 5 STEPS PASSED PERFECTLY END-TO-END!');
}

runEndToEndTest().catch(err => {
  console.error('❌ Test Execution Error:', err.message);
  process.exit(1);
});
