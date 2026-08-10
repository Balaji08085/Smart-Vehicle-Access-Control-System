import React from 'react';
import tvLogoLight from '../assets/tv_transparent.png';
import tvLogoDark from '../assets/tv_transparent_dark.png';

/**
 * SVACS - Smart Vehicle Access Control System
 * Logo Component featuring the official MCC Crest logo image
 */
export const SvacsLogo = ({ size = 44, showText = true, dark = true, className = "" }) => {
  const textPrimary  = dark ? '#701A1A' : '#FFFFFF';
  const textSub      = dark ? '#475569' : '#CBD5E1';
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

      {/* ── Wordmark ── */}
      {showText && (
        <div className="shrink-0 flex flex-col justify-center whitespace-nowrap">

          {/* Main brand name */}
          <span
            style={{
              fontFamily: "'Inter', 'Montserrat', 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: size * 0.52,
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              color: textPrimary,
            }}
          >
            MCC - MRF
          </span>

          {/* Tagline */}
          <span
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontWeight: 800,
              fontSize: size * 0.20,
              letterSpacing: '0.06em',
              color: textSub,
              marginTop: 1,
              textTransform: 'uppercase',
            }}
          >
            Innovation Park
          </span>

          {/* Thin Horizontal Divider Line */}
          <div style={{ height: '1.2px', backgroundColor: dark ? '#94A3B8' : '#475569', margin: '3px 0' }} />

          {/* Sub-tagline */}
          <span
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontWeight: 600,
              fontSize: size * 0.16,
              letterSpacing: '0.02em',
              color: textSub,
              textTransform: 'capitalize',
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
