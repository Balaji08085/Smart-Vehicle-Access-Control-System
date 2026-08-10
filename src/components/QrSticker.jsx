import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import SvacsLogo from './SvacsLogo';
import MccLogo from './MccLogo';
import { Printer, ShieldCheck, Download, X } from 'lucide-react';

const QrSticker = ({ request, token, onClose }) => {
  const printRef = useRef(null);

  if (!request) return null;

  const qrToken = token || request.token || `BIKE-2026-${request.bikeNumber.replace(/\s+/g, '')}`;
  const verifyUrl = `${window.location.origin}/verify/${qrToken}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Sticker - ${request.bikeNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=JetBrains+Mono:wght@700;800&display=swap');
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #f3f4f6;
              font-family: 'Outfit', sans-serif;
            }
            .sticker-card {
              width: 380px;
              background: #090D16;
              color: white;
              border-radius: 24px;
              padding: 24px;
              border: 3px solid #EAB308;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
              position: relative;
              box-sizing: border-box;
            }
            .header-badge {
              text-align: center;
              background: linear-gradient(90deg, #DC2626, #EA580C);
              color: white;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 2px;
              text-transform: uppercase;
              padding: 6px 12px;
              border-radius: 999px;
              margin-bottom: 16px;
            }
            .org-title {
              text-align: center;
              font-size: 16px;
              font-weight: 900;
              color: #F8FAFC;
              letter-spacing: 0.5px;
              margin: 0 0 4px 0;
            }
            .org-sub {
              text-align: center;
              font-size: 10px;
              color: #94A3B8;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 16px;
            }
            .qr-box {
              background: white;
              padding: 16px;
              border-radius: 16px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 0 auto 16px auto;
              width: 180px;
              height: 180px;
            }
            .bike-plate {
              background: #1E293B;
              border: 2px solid #EAB308;
              text-align: center;
              padding: 8px;
              border-radius: 12px;
              margin-bottom: 16px;
            }
            .bike-number {
              font-family: 'JetBrains Mono', monospace;
              font-size: 24px;
              font-weight: 800;
              color: #FACC15;
              letter-spacing: 2px;
            }
            .info-grid {
              font-size: 12px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              background: rgba(255,255,255,0.05);
              padding: 12px;
              border-radius: 12px;
            }
            .info-label {
              color: #64748B;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .info-val {
              color: #F8FAFC;
              font-weight: 700;
            }
            @media print {
              body { background: transparent; padding: 0; }
              .sticker-card { box-shadow: none; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="sticker-card">
            <div class="header-badge">MRF INNOVATION PARK — BIKE PERMIT</div>
            <h2 class="org-title">SMART VEHICLE ACCESS CONTROL</h2>
            <div class="org-sub">SECURE DIGITAL QR STICKER</div>
            
            <div class="qr-box">
              ${document.getElementById('sticker-qr-svg')?.outerHTML || ''}
            </div>

            <div class="bike-plate">
              <div class="bike-number">${request.bikeNumber}</div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-label">USER NAME</div>
                <div class="info-val">${request.name}</div>
              </div>
              <div>
                <div class="info-label">EMP / STU ID</div>
                <div class="info-val">${request.employeeId || 'N/A'}</div>
              </div>
              <div>
                <div class="info-label">COMPANY</div>
                <div class="info-val">${request.company}</div>
              </div>
              <div>
                <div class="info-label">EXPIRY</div>
                <div class="info-val">${new Date(request.accessExpiryDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 p-4 md:p-6 overflow-y-auto flex items-start sm:items-center justify-center">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> Official Printable Sticker
          </div>
          <h2 className="text-2xl font-extrabold text-white">Vehicle Access Permit</h2>
        </div>

        {/* High Resolution Sticker Box */}
        <div ref={printRef} className="bg-[#090D16] border-2 border-amber-500 rounded-2xl p-6 shadow-2xl relative text-slate-100">
          <div className="text-center mb-4">
            <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 py-1 px-3 rounded-full border border-amber-500/30 inline-block mb-2">
              MRF Innovation Park Access
            </div>
            <h3 className="text-base font-black uppercase text-white tracking-wide">Madras Christian College</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Bike QR Security Sticker</p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-xl flex justify-center items-center my-4 shadow-inner">
            <div id="sticker-qr-svg">
              <QRCodeSVG
                value={verifyUrl}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Vehicle Plate */}
          <div className="bg-slate-800 border border-amber-500/40 rounded-xl p-2.5 text-center my-3">
            <span className="font-mono text-2xl font-black text-amber-400 tracking-widest uppercase">
              {request.bikeNumber}
            </span>
          </div>

          {/* User & Access Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Owner Name</span>
              <span className="font-bold text-white block truncate">{request.name}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">ID Number</span>
              <span className="font-bold text-white block">{request.employeeId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Company</span>
              <span className="font-bold text-white block truncate">{request.company}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Expiry Date</span>
              <span className="font-bold text-emerald-400 block">{new Date(request.accessExpiryDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handlePrint}
            className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-102 active:scale-98 flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" /> Print High-Res Sticker
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrSticker;
