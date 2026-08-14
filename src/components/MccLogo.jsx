import React from 'react';
import tvLogoLight from '../assets/tv_transparent.png';
import tvLogoDark from '../assets/tv_transparent_dark.png';

export const MccLogo = ({ size = 52, showText = true, className = "", dark = true }) => {
  const logoSrc = dark ? tvLogoLight : tvLogoDark;

  return (
    <div className={`flex items-center gap-3.5 shrink-0 select-none ${className}`}>
      
      {/* Official Crest Badge Logo */}
      <div className="relative shrink-0 group">
        <img 
          src={logoSrc} 
          alt="Madras Christian College Crest"
          style={{
            height: size,
            width: 'auto',
            display: 'block',
            objectFit: 'contain'
          }}
          className="group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
        />
      </div>

      {/* Official MCC-MRF INNOVATION PARK Logo Typography */}
      {showText && (
        <div className="shrink-0 flex flex-col justify-center whitespace-nowrap">
          {/* Top Line: MCC - MRF */}
          <div className="text-[#701A1A] dark:text-red-400 font-black text-xl tracking-tight leading-none font-sans">
            MCC - MRF
          </div>

          {/* Sub-line 1: INNOVATION PARK */}
          <div className="text-[#3B4E68] dark:text-slate-300 font-extrabold text-[11px] uppercase tracking-[0.14em] leading-tight pt-0.5 font-sans">
            INNOVATION PARK
          </div>

          {/* Thin Divider Line */}
          <div className="h-[1.5px] bg-[#3B4E68]/40 dark:bg-slate-500/50 w-full my-0.5" />

          {/* Sub-line 2: Madras Christian College */}
          <div className="text-[#475569] dark:text-slate-400 font-semibold text-[9.5px] tracking-wide font-sans">
            Madras Christian College
          </div>
        </div>
      )}

    </div>
  );
};

export default MccLogo;
