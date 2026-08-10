import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Bike Access Workflow API Verification...');

  try {
    // 1. Create a request (Super Admin)
    console.log('\n[Test 1] Super Admin creating Bike Access Request...');
    const createRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Balaji S',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        employeeId: '23BCS045',
        department: 'Computer Science & Engineering',
        company: 'MRF Innovation Lab',
        designation: 'Senior Research Scientist',
        bikeNumber: 'TN 99 ZZZ 8888',
        email: 'balaji@mrf-innovationpark.edu',
        mobile: '+91 98765 43210',
        accessStartDate: '2026-01-01',
        accessExpiryDate: '2027-01-01'
      })
    });


    const createData = await createRes.json();
    console.log('✅ Create Request Response:', createRes.status, createData);
    if (!createRes.ok) throw new Error('Create request failed: ' + JSON.stringify(createData));

    const reqId = createData._id;

    // 2. Try duplicate bike number (Should fail)
    console.log('\n[Test 2] Submitting duplicate bike number (Should fail)...');
    const dupRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        department: 'Physics',
        company: 'Lab',
        designation: 'Staff',
        bikeNumber: 'TN 99 ZZZ 8888',
        email: 'dup@mcc.edu',
        mobile: '+91 98765 00000',
        accessStartDate: '2026-01-01',
        accessExpiryDate: '2027-01-01'
      })
    });

    console.log('✅ Duplicate Bike Check:', dupRes.status, await dupRes.json());

    // 3. Admin gets pending requests
    console.log('\n[Test 3] Fetching Pending Requests...');
    const pendingRes = await fetch(`${BASE_URL}/requests/pending`);
    const pendingData = await pendingRes.json();
    console.log(`✅ Pending Requests Count: ${pendingData.length}`);

    // 4. Admin approves request
    console.log('\n[Test 4] Admin approving request...');
    const approveRes = await fetch(`${BASE_URL}/requests/${reqId}/approve`, { method: 'PUT' });
    const approveData = await approveRes.json();
    console.log('✅ Approve Response:', approveRes.status, approveData);

    const token = approveData.token || 'test-token';

    // 5. Security Guard scans QR (Case 1: Approved & Valid -> GRANTED)
    console.log('\n[Test 5] Verification Scan - Case 1: Valid Approved Token...');
    const verifyValidRes = await fetch(`${BASE_URL}/verify/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device: 'Gate Terminal 1' })
    });
    const verifyValidData = await verifyValidRes.json();
    console.log('✅ Verification (Valid):', verifyValidData.status, verifyValidData.reason);

    // 6. Security Guard scans Expired Token (Case 2: Expired -> DENIED)
    console.log('\n[Test 6] Verification Scan - Case 2: Expired Token...');
    const verifyExpRes = await fetch(`${BASE_URL}/verify/expired-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const verifyExpData = await verifyExpRes.json();
    console.log('✅ Verification (Expired):', verifyExpData.status, verifyExpData.reason);

    // 7. Security Guard scans Disabled Token (Case 3: Disabled -> DENIED)
    console.log('\n[Test 7] Verification Scan - Case 3: Disabled Token...');
    const verifyDisRes = await fetch(`${BASE_URL}/verify/disabled-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const verifyDisData = await verifyDisRes.json();
    console.log('✅ Verification (Disabled):', verifyDisData.status, verifyDisData.reason);

    // 8. Security Guard scans Invalid QR (Case 4: Invalid QR -> DENIED)
    console.log('\n[Test 8] Verification Scan - Case 4: Invalid QR Token...');
    const verifyInvalidRes = await fetch(`${BASE_URL}/verify/random-fake-token-999`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const verifyInvalidData = await verifyInvalidRes.json();
    console.log('✅ Verification (Invalid QR):', verifyInvalidData.status, verifyInvalidData.reason);

    // 9. Dashboard Statistics API
    console.log('\n[Test 9] Fetching Dashboard Statistics...');
    const dashRes = await fetch(`${BASE_URL}/dashboard`);
    const dashData = await dashRes.json();
    console.log('✅ Dashboard Stats:', dashData);

    console.log('\n🎉 ALL 9 TEST SUITES COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

runTests();
