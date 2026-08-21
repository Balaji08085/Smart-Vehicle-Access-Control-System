import QRCode from 'qrcode';
import { MCC_LOGO_BASE64 } from '../assets/logoBase64';

export const downloadQrCode = async (req) => {
  if (!req) return;

  const name = req.name || req.ownerName || 'User';
  const bikeNumber = req.bikeNumber || req.vehicleNumber || 'Vehicle';
  const employeeId = req.employeeId || req.registerId || 'N/A';
  const department = req.department || req.company || 'MCC MRF Innovation Park';
  const expiryDate = req.accessExpiryDate || req.expiryDate
    ? new Date(req.accessExpiryDate || req.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '19 Aug 2027';

  const qrToken = req.token || req.qrToken || `BIKE-2026-${bikeNumber.replace(/\s+/g, '')}`;
  
  const liveDomain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'https://smart-vehicle-access-control-system.mccmrfip.in' 
    : window.location.origin;
  const verifyUrl = `${liveDomain}/verify/${qrToken}`;

  try {
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 960;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Clean White Card Canvas Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Card Outer Border (Burgundy double border)
    ctx.strokeStyle = '#701A1A';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Outer Header Strip (Burgundy Brand Header)
    ctx.fillStyle = '#701A1A';
    ctx.fillRect(10, 10, width - 20, 110);

    // Brand Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MADRAS CHRISTIAN COLLEGE', width / 2, 54);

    ctx.fillStyle = '#F87171';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('MCC - MRF INNOVATION PARK • SECURE QR STICKER PASS', width / 2, 88);

    // 2. Render High Resolution Base QR Code with High Error Correction Level ('H')
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, verifyUrl, {
      width: 520,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H'
    });

    const qrSize = 520;
    const qrX = (width - qrSize) / 2;
    const qrY = 145;

    // Draw main QR code
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // 3. Draw White Cutout Box in Center of QR Code for Logo
    const qrCenterX = width / 2;
    const qrCenterY = qrY + qrSize / 2;
    const boxSize = 145;
    const boxX = qrCenterX - boxSize / 2;
    const boxY = qrCenterY - boxSize / 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, 20);
    ctx.fill();
    ctx.strokeStyle = '#701A1A';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. Draw Official MCC Logo Image in Exact Center of QR Code
    const logoImg = new Image();
    logoImg.src = MCC_LOGO_BASE64;
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
    });

    const logoDrawSize = 120;
    const logoX = qrCenterX - logoDrawSize / 2;
    const logoY = qrCenterY - logoDrawSize / 2;
    ctx.drawImage(logoImg, logoX, logoY, logoDrawSize, logoDrawSize);

    // 5. Render License Plate Badge Below QR Code
    const plateX = 80;
    const plateY = 685;
    const plateW = 640;
    const plateH = 80;
    const radius = 20;

    ctx.fillStyle = '#FEF3C7';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(plateX, plateY, plateW, plateH, radius);
    ctx.fill();
    ctx.stroke();

    // IND Flag Mark
    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🇮🇳 IND', plateX + 24, plateY + 48);

    // Plate Text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 38px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(bikeNumber.toUpperCase(), width / 2 + 20, plateY + 54);

    // 6. User Info Footer Section
    const infoY = 785;
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), width / 2, infoY + 25);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`ID: ${employeeId}  •  DEPT: ${department.toUpperCase()}`, width / 2, infoY + 55);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`VALID UNTIL: ${expiryDate}`, width / 2, infoY + 82);

    // 7. Trigger PNG File Download
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;

    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanPlate = bikeNumber.replace(/[^a-zA-Z0-9]/g, '_');
    downloadLink.download = `${cleanName}_${cleanPlate}_QR_StickerPass.png`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (err) {
    console.error('Failed to generate PNG QR via canvas:', err);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(verifyUrl)}&margin=15`;
    const downloadLink = document.createElement('a');
    downloadLink.href = qrApiUrl;
    downloadLink.target = '_blank';
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanPlate = bikeNumber.replace(/[^a-zA-Z0-9]/g, '_');
    downloadLink.download = `${cleanName}_${cleanPlate}_QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
};
