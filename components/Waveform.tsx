'use client';

import { useEffect, useRef } from 'react';

interface WaveformProps {
  data: number[];
  color?: string;
}

export function Waveform({ data, color = '#ffffff' }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let animationFrameId: number;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const width = canvas.width;
    const height = canvas.height;

    // Smooth incoming data to prevent blocky jaggies
    const windowSize = Math.max(1, Math.floor(data.length / 25));
    const smoothed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize); j <= Math.min(data.length - 1, i + windowSize); j++) {
        sum += data[j];
        count++;
      }
      smoothed[i] = sum / count;
    }

    // Normalize smoothed data dynamically
    let maxVal = 0;
    for (let i = 0; i < smoothed.length; i++) {
      if (smoothed[i] > maxVal) maxVal = smoothed[i];
    }
    
    if (maxVal > 0) {
      for (let i = 0; i < smoothed.length; i++) {
        smoothed[i] /= maxVal;
        smoothed[i] = Math.pow(smoothed[i], 0.7); // Non-linear boost for low volume nuances
      }
    }

    const linesCount = 20;

    const draw = () => {
      time += 0.015;
      
      // Use slightly transparent clear to leave a very faint trail, or just clear exactly.
      ctx.clearRect(0, 0, width, height);

      // Center horizon line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let l = 0; l < linesCount; l++) {
        ctx.beginPath();
        
        const layerNorm = l / (linesCount - 1); // 0.0 to 1.0
        const isForeground = l > linesCount - 4;
        
        // Background lines are faint, foreground are brighter
        const opacity = 0.05 + Math.pow(layerNorm, 2) * 0.5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 0.5 + layerNorm * 1.5;

        // Apply glow only to top layers to save performance
        if (isForeground) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.moveTo(0, height / 2);

        // Step size for drawing the curve, smaller step = smoother curve
        for (let x = 0; x <= width; x += 4) {
          const progress = x / width;
          
          let env = 0;
          if (smoothed.length > 0) {
            const floatIdx = progress * (smoothed.length - 1);
            const i1 = Math.floor(floatIdx);
            const i2 = Math.ceil(floatIdx);
            const frac = floatIdx - i1;
            env = smoothed[i1] * (1 - frac) + (smoothed[i2] || smoothed[i1]) * frac;
          }

          // Layer-specific frequencies and phase offsets to make them organic and intertwined
          const freq1 = 8 + layerNorm * 4;
          const freq2 = 18 - layerNorm * 6;
          const freq3 = 25 + layerNorm * 10;
          
          const phase1 = time * (1.0 + layerNorm * 0.5) + layerNorm * Math.PI * 4;
          const phase2 = -time * (0.6 + layerNorm * 0.2) + layerNorm * Math.PI * 2;
          const phase3 = time * 2.0 + layerNorm;
          
          // Combine sines to create a complex organic LFO
          const wave = Math.sin(progress * Math.PI * freq1 + phase1) * 0.55 + 
                       Math.sin(progress * Math.PI * freq2 + phase2) * 0.30 +
                       Math.sin(progress * Math.PI * freq3 + phase3) * 0.15;
                       
          // Smoothly taper to 0 at the very edges so lines connect to the center
          const taper = Math.pow(Math.sin(progress * Math.PI), 0.5);
          
          // Max amplitude based on the recorded envelope
          const maxAmp = height * 0.45;
          const amplitude = env * maxAmp * (0.4 + layerNorm * 0.6) * taper;
          
          const y = (height / 2) + wave * amplitude;
          ctx.lineTo(x, y);
        }
        
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [data, color]);

  return (
    <div className="w-full h-40 relative rounded-2xl overflow-hidden bg-transparent">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
