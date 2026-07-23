// Test: decode the generated QR PNG using jimp + jsqr (same as browser logic)
import { Jimp } from 'jimp';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jsQR = require('jsqr');

const files = [
  { file: 'test_qr_valid_student.png', expected: 'TN-38-AB-1234' },
  { file: 'test_qr_valid_faculty.png', expected: 'TN-38-XY-9999' },
  { file: 'test_qr_expired.png',       expected: 'TN-38-EXP-2025' },
];

let allPassed = true;

for (const { file, expected } of files) {
  try {
    const image = await Jimp.read(file);
    const { data, width, height } = image.bitmap;
    const code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });

    if (code && code.data === expected) {
      console.log(`✅ PASS  ${file}  →  "${code.data}"`);
    } else if (code) {
      console.log(`❌ MISMATCH  ${file}  →  got "${code.data}", expected "${expected}"`);
      allPassed = false;
    } else {
      console.log(`❌ FAIL  ${file}  →  no QR code detected`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`❌ ERROR  ${file}  →  ${e.message}`);
    allPassed = false;
  }
}

console.log('');
console.log(allPassed ? '🎉 All QR decode tests PASSED!' : '⚠️  Some tests FAILED');
