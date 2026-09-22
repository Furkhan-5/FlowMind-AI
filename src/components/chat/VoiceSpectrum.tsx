'use client';

import React, { useEffect, useRef } from 'react';

interface VoiceSpectrumProps {
  isActive: boolean;
  activeLanguage: string;
}

export const VoiceSpectrum: React.FC<VoiceSpectrumProps> = ({ isActive, activeLanguage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barCount = 24;
      const barWidth = width / barCount - 2;

      phase += 0.08;

      for (let i = 0; i < barCount; i++) {
        // Generate simulated dynamic frequency height
        const value = Math.sin(phase + i * 0.4) * 0.4 + Math.cos(phase * 1.5 + i * 0.2) * 0.4 + 0.5;
        const barHeight = Math.max(6, value * (height - 8));

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#10b981');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="p-3 rounded-2xl bg-bloom-dark text-white border border-purple-500/40 shadow-bloom space-y-2 animate-fadeIn">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-bold text-purple-300">Voice STT / TTS Active ({activeLanguage.toUpperCase()})</span>
        </div>
        <span className="text-[10px] text-slate-400">Listening to Speech Spectrum...</span>
      </div>

      <canvas ref={canvasRef} width={360} height={40} className="w-full h-10 rounded-lg bg-black/40" />
    </div>
  );
};
