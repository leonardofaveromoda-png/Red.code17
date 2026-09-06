import React from 'react';

interface RedCodeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  variant?: 'full' | 'emblem' | 'horizontal';
}

export const RedCodeLogo: React.FC<RedCodeLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  variant = 'full'
}) => {
  // Dimensions mapping
  const sizeMap = {
    xs: { diameter: 36, textRed: 'text-sm', textTag: 'text-[7px]' },
    sm: { diameter: 48, textRed: 'text-base', textTag: 'text-[9px]' },
    md: { diameter: 80, textRed: 'text-xl', textTag: 'text-[10px]' },
    lg: { diameter: 120, textRed: 'text-3xl', textTag: 'text-xs' },
    xl: { diameter: 180, textRed: 'text-4xl', textTag: 'text-sm' }
  };

  const currentSize = sizeMap[size];

  // SVG Emblem matching the official photo exactly
  const EmblemSvg = (
    <svg
      viewBox="0 0 200 200"
      width={currentSize.diameter}
      height={currentSize.diameter}
      className="drop-shadow-[0_8px_20px_rgba(220,38,38,0.35)] shrink-0 transition-transform hover:scale-102"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Dark radial metallic gradient for badge background */}
        <radialGradient id="rc-disc-bg" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#1E2024" />
          <stop offset="60%" stopColor="#0F1013" />
          <stop offset="100%" stopColor="#050608" />
        </radialGradient>

        {/* Outer metallic ring */}
        <linearGradient id="rc-metal-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="50%" stopColor="#111827" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>

        {/* Vibrant Red Glow Gradient */}
        <linearGradient id="rc-red-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>

        {/* Chrome Gradient for CODE */}
        <linearGradient id="rc-chrome" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Subtle 3D shadow filter */}
        <filter id="rc-bevel" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
        </filter>
        <filter id="rc-red-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#EF4444" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Outer 3D Bevel Border */}
      <circle cx="100" cy="100" r="96" fill="url(#rc-metal-rim)" stroke="#1F2937" strokeWidth="2" />
      <circle cx="100" cy="100" r="92" fill="#08090C" />

      {/* Double Glowing Red Concentric Ring from Photo */}
      <circle
        cx="100"
        cy="100"
        r="88"
        fill="none"
        stroke="url(#rc-red-glow)"
        strokeWidth="3.2"
        filter="url(#rc-red-glow-filter)"
      />
      <circle cx="100" cy="100" r="85" fill="none" stroke="#000000" strokeWidth="1.5" />
      <circle
        cx="100"
        cy="100"
        r="83"
        fill="none"
        stroke="url(#rc-red-glow)"
        strokeWidth="1.2"
        opacity="0.8"
      />

      {/* Inner Central Disc */}
      <circle cx="100" cy="100" r="81" fill="url(#rc-disc-bg)" />

      {/* Heartbeat ECG wave forming R symbol and Arrow (from official photo) */}
      <g filter="url(#rc-bevel)">
        {/* Left ECG baseline + P-wave + Dip */}
        <path
          d="M 32 86 L 50 86 C 54 86 56 81 60 81 C 64 81 66 86 70 86 L 80 86 L 85 91 L 91 42"
          fill="none"
          stroke="url(#rc-red-glow)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tall vertical cardiac R spike */}
        <path
          d="M 91 42 L 94 112"
          fill="none"
          stroke="url(#rc-red-glow)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upper rounded loop of the "R" letter */}
        <path
          d="M 99 49 L 126 49 C 137 49 143 56 143 66 C 143 76 137 83 126 83 L 99 83"
          fill="none"
          stroke="url(#rc-red-glow)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Horizontal Arrow extending to the right */}
        <path
          d="M 124 86 L 168 86"
          fill="none"
          stroke="url(#rc-red-glow)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Arrowhead pointing right */}
        <path
          d="M 160 81 L 168 86 L 160 91"
          fill="none"
          stroke="url(#rc-red-glow)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Diagonal leg of the "R" letter */}
        <path
          d="M 126 86 L 145 112"
          fill="none"
          stroke="url(#rc-red-glow)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Embossed Text inside Emblem: RED (in Red) and CODE (in Chrome) */}
      <g filter="url(#rc-bevel)">
        <text
          x="75"
          y="142"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="24"
          fill="url(#rc-red-glow)"
          textAnchor="middle"
          letterSpacing="1"
        >
          RED
        </text>
        <text
          x="128"
          y="142"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="24"
          fill="url(#rc-chrome)"
          textAnchor="middle"
          letterSpacing="1"
        >
          CODE
        </text>
      </g>

      {/* Subtitle inside Emblem: — CAPACITAÇÃO EM EMERGÊNCIA — */}
      <g opacity="0.95">
        <line x1="38" y1="156" x2="48" y2="156" stroke="url(#rc-red-glow)" strokeWidth="1.8" strokeLinecap="round" />
        <text
          x="100"
          y="158"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="8.5"
          fill="#D1D5DB"
          textAnchor="middle"
          letterSpacing="1.8"
        >
          CAPACITAÇÃO EM EMERGÊNCIA
        </text>
        <line x1="152" y1="156" x2="162" y2="156" stroke="url(#rc-red-glow)" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  );

  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {EmblemSvg}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        {EmblemSvg}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 font-black tracking-tight leading-none">
            <span className="text-red-500 text-xl sm:text-2xl font-black drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
              RED
            </span>
            <span className="text-slate-100 text-xl sm:text-2xl font-black tracking-wider">
              CODE
            </span>
          </div>
          {showTagline && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-0.5 bg-red-600 rounded-full" />
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap">
                CAPACITAÇÃO EM EMERGÊNCIA
              </span>
              <span className="w-2 h-0.5 bg-red-600 rounded-full" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full / Medallion Layout
  return (
    <div className={`inline-flex flex-col items-center text-center ${className}`}>
      {EmblemSvg}
      {showTagline && size !== 'xs' && size !== 'sm' && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-black tracking-tight leading-none">
            <span className="text-red-500 font-extrabold text-lg sm:text-2xl drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              RED
            </span>
            <span className="text-white font-extrabold text-lg sm:text-2xl tracking-wider">
              CODE
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="text-red-500">—</span>
            Capacitação em Emergência
            <span className="text-red-500">—</span>
          </p>
        </div>
      )}
    </div>
  );
};
