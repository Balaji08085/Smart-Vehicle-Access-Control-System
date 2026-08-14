import React from 'react';
import tvLogoLight from '../assets/tv_transparent.png';
import tvLogoDark from '../assets/tv_transparent_dark.png';

/**
 * SVACS - Smart Vehicle Access Control System
 * Logo Component featuring the official MCC Crest logo image
 */
export const SvacsLogo = ({ size = 44, showText = true, dark = true, className = "" }) => {
  const textPrimary  = dark ? '#701A1A' : '#F87171';
  const textNavy     = dark ? '#3B4E68' : '#CBD5E1';
  const textSub      = dark ? '#475569' : '#94A3B8';
  const lineCol      = dark ? '#3B4E68' : '#64748B';
  const logoSrc      = dark ? tvLogoLight : tvLogoDark;

  return (
    <div className={`flex items-center gap-3 shrink-0 select-none ${className}`}>

      {/* ── Official Crest Badge Icon ── */}
      <div className="relative shrink-0 group">
        <img
          src={logoSrc}
          alt="MCC Crest Logo"
          style={{
            width: size * 1.5,
            height: 'auto',
            display: 'block',
            objectFit: 'contain'
          }}
          className="group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
        />
      </div>

      {/* ── Official Logo Typography ── */}
      {showText && (
        <div className="shrink-0 flex flex-col justify-center whitespace-nowrap">

          {/* Main brand name: MCC - MRF */}
          <span
            style={{
              fontFamily: "'Inter', 'Montserrat', 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: size * 0.48,
              letterSpacing: '0.02em',
              lineHeight: 1.1,
              color: textPrimary,
            }}
          >
            MCC - MRF
          </span>

          {/* Tagline: INNOVATION PARK */}
          <span
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontWeight: 800,
              fontSize: size * 0.20,
              letterSpacing: '0.12em',
              color: textNavy,
              marginTop: 1,
              textTransform: 'uppercase',
            }}
          >
            INNOVATION PARK
          </span>

          {/* Thin Horizontal Divider Line */}
          <div style={{ height: '1.2px', backgroundColor: lineCol, margin: '2px 0' }} />

          {/* Sub-tagline: Madras Christian College */}
          <span
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontWeight: 600,
              fontSize: size * 0.16,
              letterSpacing: '0.02em',
              color: textSub,
            }}
          >
            Madras Christian College
          </span>
        </div>
      )}
    </div>
  );
};

export default SvacsLogo;
