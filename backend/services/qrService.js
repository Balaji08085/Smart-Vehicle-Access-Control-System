import crypto from 'crypto';

let counter = Math.floor(Math.random() * 1000) + 1;

export const generateSecureToken = () => {
  // Generates a unique secure identifier format: BIKE-2026-XXXXXX with crypto entropy
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  counter = (counter + 1) % 999999;
  const countStr = counter.toString().padStart(6, '0');
  return `BIKE-2026-${countStr}-${randomHex}`;
};

export const getQRImageUrl = (token, domain = 'http://localhost:5174') => {
  // The QR code contains ONLY the URL to verify the token - NO personal data
  const verifyUrl = `${domain}/verify/${token}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verifyUrl)}`;
};

