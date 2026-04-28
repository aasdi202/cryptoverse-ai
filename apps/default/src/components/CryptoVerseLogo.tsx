import React from 'react';

interface CryptoVerseLogoProps {
  size?: number;
  className?: string;
}

/**
 * CryptoVerse AI — brand logo mark.
 * A CV monogram in gold/blue on dark navy, matching the brand palette:
 *   Primary dark:  #0A1929
 *   Gold:          #FFD700
 *   Blue accent:   #1a73e8
 */
export function CryptoVerseLogo({ size = 40, className = '' }: CryptoVerseLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CryptoVerse AI Logo"
    >
      <defs>
        <linearGradient id="cvBg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0A1929" />
          <stop offset="100%" stopColor="#0d2137" />
        </linearGradient>
        <linearGradient id="cvGold" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFA500" />
        </linearGradient>
        <linearGradient id="cvBlue" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a73e8" />
          <stop offset="100%" stopColor="#4285f4" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="url(#cvBg)" />

      {/* Subtle outer ring */}
      <circle cx="20" cy="20" r="17" stroke="url(#cvGold)" strokeWidth="0.8" fill="none" opacity="0.5" />

      {/* C letterform */}
      <path
        d="M12.5 13 Q7 20 12.5 27"
        stroke="url(#cvGold)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="12.5" y1="13" x2="17" y2="13" stroke="url(#cvGold)" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="12.5" y1="27" x2="17" y2="27" stroke="url(#cvGold)" strokeWidth="2.6" strokeLinecap="round" />

      {/* V letterform */}
      <path
        d="M19 13 L23 27 L27 13"
        stroke="url(#cvBlue)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* AI sparkle dot — top right */}
      <circle cx="34" cy="8" r="3" fill="url(#cvGold)" opacity="0.95" />
      <circle cx="34" cy="8" r="1.5" fill="#fff" opacity="0.4" />
    </svg>
  );
}
