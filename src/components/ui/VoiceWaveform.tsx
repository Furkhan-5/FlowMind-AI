'use client';

import React from 'react';

interface VoiceWaveformProps {
  isActive?: boolean;
  barCount?: number;
  className?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isActive = true,
  barCount = 28,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center gap-1 h-12 px-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-purple-500/30 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        // Height variation for dynamic soundwave effect
        const heights = ['h-3', 'h-6', 'h-10', 'h-5', 'h-8', 'h-12', 'h-4', 'h-7', 'h-11'];
        const currentHeight = heights[i % heights.length];

        return (
          <div
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t from-purple-600 via-indigo-400 to-cyan-300 transition-all duration-300 ${
              isActive ? `${currentHeight} animate-pulse` : 'h-2 opacity-40'
            }`}
            style={{
              animationDelay: `${(i % 7) * 120}ms`,
              animationDuration: `${600 + (i % 5) * 150}ms`,
            }}
          />
        );
      })}
    </div>
  );
};
