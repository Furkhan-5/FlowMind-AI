'use client';

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 30, text: 'text-base font-black' },
    md: { icon: 38, text: 'text-xl font-black' },
    lg: { icon: 48, text: 'text-2xl font-black' },
    xl: { icon: 64, text: 'text-4xl font-black' },
  };

  const { icon, text } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Concept 4: Infinity Wave emblem (Bigger & High Visibility) */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:scale-105 duration-300 shrink-0 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
      >
        {/* Outer Infinity Wave Curve */}
        <path
          d="M12 20C12 16 15.5 14 18.5 17L21.5 23C24.5 26 28 24 28 20C28 16 24.5 14 21.5 17L18.5 23C15.5 26 12 24 12 20Z"
          stroke="url(#brand_infinity_grad)"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Central Glowing Core Node */}
        <circle cx="20" cy="20" r="3" fill="#ffffff" />
        <circle cx="20" cy="20" r="5.5" fill="#c084fc" opacity="0.4" />

        {/* Gradients */}
        <defs>
          <linearGradient
            id="brand_infinity_grad"
            x1="10"
            y1="12"
            x2="30"
            y2="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#a855f7" />
            <stop offset="0.5" stopColor="#c084fc" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <span className={`tracking-tight text-white ${text}`}>
          FlowMind <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
        </span>
      )}
    </div>
  );
};
