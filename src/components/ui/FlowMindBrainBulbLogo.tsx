import React from 'react';

interface FlowMindBrainBulbLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const FlowMindBrainBulbLogo: React.FC<FlowMindBrainBulbLogoProps> = ({
  size = 'md',
  className = '',
  glow = true,
}) => {
  const dimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${dimensions[size]} ${className}`}
    >
      {/* Outer Glow Halo */}
      {glow && (
        <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-md animate-pulse pointer-events-none" />
      )}

      {/* SVG Brain Lightbulb Icon matching Image 2 */}
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="neonGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <radialGradient id="brainGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Lightbulb Glass Contour */}
        <path
          d="M50 8 C25 8 12 28 12 48 C12 62 24 74 30 84 C34 90 34 96 34 98 L66 98 C66 96 66 90 70 84 C76 74 88 62 88 48 C88 28 75 8 50 8 Z"
          stroke="url(#neonGold)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#brainGlow)"
        />

        {/* 3D Brain Folds (Left Hemisphere) */}
        <path
          d="M46 22 C36 22 24 28 24 38 C24 44 29 48 34 46 C36 45 38 41 38 37 C38 31 44 27 46 32 C48 37 40 43 36 49 C32 55 26 57 28 65 C30 73 40 73 44 68 C46 66 46 60 46 56"
          stroke="url(#neonGold)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3D Brain Folds (Right Hemisphere) */}
        <path
          d="M54 22 C64 22 76 28 76 38 C76 44 71 48 66 46 C64 45 62 41 62 37 C62 31 56 27 54 32 C52 37 60 43 64 49 C68 55 74 57 72 65 C70 73 60 73 56 68 C54 66 54 60 54 56"
          stroke="url(#neonGold)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Stem Connection */}
        <path
          d="M50 56 L50 96"
          stroke="url(#neonGold)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Threaded Metallic Base */}
        <path d="M34 102 L66 102" stroke="url(#neonGold)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M37 108 L63 108" stroke="url(#neonGold)" strokeWidth="4" strokeLinecap="round" />
        <path d="M41 114 L59 114" stroke="url(#neonGold)" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};
