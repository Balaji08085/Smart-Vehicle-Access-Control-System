import React from 'react';
import tvLogoLight from '../assets/tv_transparent.png';
import tvLogoDark from '../assets/tv_transparent_dark.png';

export const MccLogo = ({ size = 56, showText = true, className = "", dark = true }) => {
  const logoSrc = dark ? tvLogoLight : tvLogoDark;

  return (
    <div className={`flex items-center gap-3.5 shrink-0 select-none ${className}`}>
      
      {/* Official Madras Christian College (MCC) Crest Logo */}
      <div className="relative shrink-0 group">
        <img 
          src={logoSrc} 
          alt="Madras Christian College Crest"
          style={{
            width: size * 1.5,
            height: 'auto',
            display: 'block',
            objectFit: 'contain'
          }}
          className="group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
        />
      </div>

      {/* Official HD Typography for MCC-MRF INNOVATION PARK */}
      {showText && (
        <div className="shrink-0 flex flex-col justify-center whitespace-nowrap space-y-0.5">
          
          {/* Top Line: MCC- MRF */}
          <div className="flex items-center leading-none tracking-tight">
            <span 
              className="text-[#701A1A] dark:text-red-400 font-serif font-black text-2xl tracking-tight mr-1.5"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900 }}
            >
              MCC-
            </span>
            
            {/* MRF in Official Heavy Red Vector Block Font */}
            <svg width="72" height="24" viewBox="0 0 110 35" fill="none" className="inline-block shrink-0">
              <path d="M 0 0 L 10 0 L 17 20 L 24 0 L 34 0 L 34 35 L 25 35 L 25 10 L 18 30 L 16 30 L 9 10 L 9 35 L 0 35 Z" fill="#DC2626" />
              <path d="M 38 0 L 58 0 C 67 0 72 4 72 11 C 72 16 68 20 61 21 L 73 35 L 62 35 L 51 22 L 47 22 L 47 35 L 38 35 Z M 47 7 L 47 16 L 57 16 C 63 16 63 14 63 11 C 63 8 61 7 57 7 Z" fill="#DC2626" />
              <path d="M 76 0 L 108 0 L 108 8 L 85 8 L 85 14 L 104 14 L 104 22 L 85 22 L 85 35 L 76 35 Z" fill="#DC2626" />
            </svg>
          </div>

          {/* Bottom Line: INNOVATION PARK */}
          <div className="leading-none">
            <span 
              className="text-[#701A1A] dark:text-amber-400 font-serif font-extrabold text-[12px] uppercase tracking-[0.16em] block"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              INNOVATION PARK
            </span>
          </div>
          
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest font-mono block pt-0.5">
            Smart Vehicle Access Verification
          </span>
        </div>
      )}

    </div>
  );
};

export default MccLogo;
