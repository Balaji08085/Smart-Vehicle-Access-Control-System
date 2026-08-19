import React, { useRef } from 'react';
import LogoQRCode from './LogoQRCode';
import { Printer, X } from 'lucide-react';

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
              background-color: #f8fafc;
              font-family: 'Outfit', sans-serif;
            }
            .sticker-card {
              width: 520px;
              background: #ffffff;
              color: #0f172a;
              border-radius: 20px;
              padding: 24px;
              border: 3px solid #701A1A;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              position: relative;
              box-sizing: border-box;
              display: grid;
              grid-template-columns: 180px 1fr;
              gap: 20px;
              align-items: center;
            }
            .qr-side {
              text-align: center;
            }
            .qr-box {
              background: white;
              padding: 12px;
              border-radius: 14px;
              display: flex;
              justify-content: center;
              align-items: center;
              border: 1px solid #e2e8f0;
              width: 150px;
              height: 150px;
              margin: 0 auto 12px auto;
            }
            .bike-plate {
              background: #FEF3C7;
              border: 2px solid #F59E0B;
              text-align: center;
              padding: 6px;
              border-radius: 10px;
            }
            .bike-number {
              font-family: 'JetBrains Mono', monospace;
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: 1.5px;
            }
            .info-side {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            .header-badge {
              display: inline-block;
              background: #701A1A;
              color: white;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              padding: 4px 10px;
              border-radius: 999px;
              margin-bottom: 4px;
            }
            .org-title {
              font-size: 15px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: 0.5px;
              margin: 0;
            }
            .org-sub {
              font-size: 10px;
              color: #701A1A;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .info-grid {
              font-size: 11px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              background: #f8fafc;
              padding: 10px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .info-label {
              color: #701A1A;
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-val {
              color: #0f172a;
              font-weight: 800;
            }
            @media print {
              body { background: transparent; padding: 0; }
              .sticker-card { box-shadow: none; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="sticker-card">
            <div class="qr-side">
              <div class="qr-box">
                ${document.getElementById('sticker-qr-svg')?.outerHTML || ''}
              </div>
              <div class="bike-plate">
                <div class="bike-number">${request.bikeNumber}</div>
              </div>
            </div>

            <div class="info-side">
              <div>
                <span class="header-badge">MRF INNOVATION PARK</span>
                <h2 class="org-title">MADRAS CHRISTIAN COLLEGE</h2>
                <div class="org-sub">SECURE DIGITAL QR PERMIT</div>
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
                  <div class="info-label">DEPARTMENT</div>
                  <div class="info-val">${request.department || request.company}</div>
                </div>
                <div>
                  <div class="info-label">EXPIRY DATE</div>
                  <div class="info-val">${new Date(request.accessExpiryDate).toLocaleDateString()}</div>
                </div>
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
    <div className="fixed inset-0 bg-slate-50/90 dark:bg-[#180305]/90 backdrop-blur-md z-50 p-4 pt-24 md:pt-28 pb-12 overflow-y-auto flex flex-col items-center justify-start">
      <div className="bg-white dark:bg-[#1E0609] border border-slate-200 dark:border-[#5C121E] rounded-2xl p-6 md:p-8 max-w-3xl w-full shadow-2xl relative space-y-5 text-slate-900 dark:text-slate-100">
        
        {/* Top Header Bar */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#5C121E] pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Vehicle Access Permit</h2>
            <span className="px-3 py-1 bg-[#701A1A]/10 border border-[#701A1A]/30 text-[#701A1A] dark:text-red-300 rounded-full text-[10px] font-black uppercase tracking-wider">
              Official Printable Sticker
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-[#2A0A0F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* High Resolution Landscape Sticker Box */}
        <div ref={printRef} className="bg-slate-50 dark:bg-[#2A0A0F] border-2 border-[#701A1A] rounded-2xl p-6 shadow-xl relative text-slate-900 dark:text-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left QR Column */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center w-full max-w-[200px]">
                <div id="sticker-qr-svg">
                  <LogoQRCode
                    value={verifyUrl}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="bg-amber-100 border border-amber-300 rounded-xl p-2.5 text-center mt-3 w-full max-w-[200px] shadow-2xs">
                <span className="font-mono text-xl font-black text-slate-900 tracking-widest uppercase">
                  {request.bikeNumber}
                </span>
              </div>
            </div>

            {/* Right Information Column */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <div className="text-[10px] font-black tracking-widest text-[#701A1A] dark:text-red-300 uppercase bg-[#701A1A]/10 py-1 px-3 rounded-full border border-[#701A1A]/30 inline-block mb-1.5">
                  MRF Innovation Park Access
                </div>
                <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-wide">Madras Christian College</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">Bike QR Security Sticker</p>
              </div>

              {/* User & Access Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-[#120305] p-4 rounded-xl border border-slate-200 dark:border-[#5C121E]">
                <div>
                  <span className="text-[9px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block">Owner Name</span>
                  <span className="font-extrabold text-slate-900 dark:text-white block truncate">{request.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block">ID Number</span>
                  <span className="font-extrabold text-slate-900 dark:text-white block">{request.employeeId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block">Department / Org</span>
                  <span className="font-extrabold text-slate-900 dark:text-white block truncate">{request.department || request.company}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block">Expiry Date</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block">{new Date(request.accessExpiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Action Button Bar */}
        <div className="pt-2">
          <button
            onClick={handlePrint}
            className="w-full py-3.5 bg-[#701A1A] hover:bg-[#5C121E] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print High-Res Sticker
          </button>
        </div>

      </div>
    </div>
  );
};

export default QrSticker;
