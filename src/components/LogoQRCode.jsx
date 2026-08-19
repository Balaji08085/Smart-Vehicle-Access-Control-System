import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MCC_LOGO_BASE64 } from '../assets/logoBase64';

export const LogoQRCode = ({
  value,
  size = 180,
  logoSize = undefined,
  level = 'H',
  includeMargin = true,
  className = '',
  id,
  style = {},
}) => {
  const calculatedLogoSize = logoSize || Math.max(32, Math.round(size * 0.28));

  return (
    <QRCodeSVG
      id={id}
      value={value || ''}
      size={size}
      level={level}
      includeMargin={includeMargin}
      imageSettings={{
        src: MCC_LOGO_BASE64,
        x: undefined,
        y: undefined,
        height: calculatedLogoSize,
        width: calculatedLogoSize,
        excavate: true,
      }}
      className={className}
      style={style}
    />
  );
};

export default LogoQRCode;
