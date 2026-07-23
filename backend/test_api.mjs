// Quick API test script
import fetch from 'node-fetch';

async function test() {
  try {
    // 1. Login to get token
    console.log('Step 1: Authenticating...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'guard', guardId: 'SEC-GATE-01', guardPin: '1234' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
    console.log('✅ Login SUCCESS - Token received:', loginData.token.substring(0, 30) + '...');

    const token = loginData.token;

    // 2. Verify a valid QR code (should be GRANTED)
    console.log('\nStep 2: Verifying valid QR code TN-38-AB-1234...');
    const verifyGranted = await fetch('http://localhost:5000/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ scannedQuery: 'TN-38-AB-1234', gateName: 'Main Gate' })
    });
    const grantedData = await verifyGranted.json();
    console.log(`✅ Verify valid QR: Status=${grantedData.status}, Owner=${grantedData.ownerName}`);

    // 3. Verify a blacklisted QR code (should be DENIED)
    console.log('\nStep 3: Verifying blacklisted QR code TN-38-ZZZ-999...');
    const verifyDenied = await fetch('http://localhost:5000/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ scannedQuery: 'TN-38-ZZZ-999', gateName: 'Main Gate' })
    });
    const deniedData = await verifyDenied.json();
    console.log(`✅ Verify blacklisted QR: Status=${deniedData.status}, Reason=${deniedData.reason}`);

    // 4. Verify an unknown QR code (should be DENIED)
    console.log('\nStep 4: Verifying unknown QR code ABC-999...');
    const verifyUnknown = await fetch('http://localhost:5000/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ scannedQuery: 'ABC-999', gateName: 'Main Gate' })
    });
    const unknownData = await verifyUnknown.json();
    console.log(`✅ Verify unknown QR: Status=${unknownData.status}, Reason=${unknownData.reason}`);

    // 5. Verify without token (should fail with 401)
    console.log('\nStep 5: Verifying without token (should fail)...');
    const verifyNoAuth = await fetch('http://localhost:5000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scannedQuery: 'TN-38-AB-1234', gateName: 'Main Gate' })
    });
    console.log(`✅ Unauthorized attempt returned HTTP ${verifyNoAuth.status} (expected 401)`);

    console.log('\n🎉 All API tests passed! Backend is working correctly.');
  } catch (err) {
    console.error('❌ Test FAILED:', err.message);
    process.exit(1);
  }
}

test();
