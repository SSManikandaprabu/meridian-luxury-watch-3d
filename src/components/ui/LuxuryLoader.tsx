import React, { useEffect, useState } from 'react';

interface LuxuryLoaderProps {
  isReady: boolean;
}

export const LuxuryLoader: React.FC<LuxuryLoaderProps> = ({ isReady }) => {
  const [progress, setProgress] = useState(14);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (isReady) {
          return Math.min(100, prev + 28);
        }
        return Math.min(88, prev + 9);
      });
    }, 60);

    return () => window.clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    if (progress >= 100 && isReady) {
      const timeout = window.setTimeout(() => setDismissed(true), 320);
      return () => window.clearTimeout(timeout);
    }
  }, [progress, isReady]);

  if (dismissed) return null;

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Meridian Horology Experience"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B1522] text-[#F2EEE6] transition-opacity duration-500 ${
        progress >= 100 && isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#8FA3B8"
            strokeOpacity="0.18"
            strokeWidth="1.25"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#D8C3A0"
            strokeWidth="1.75"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-150 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-xl tracking-widest text-[#F2EEE6]">
            {progress}%
          </span>
        </div>
      </div>

      <p className="mt-6 font-serif text-2xl tracking-[0.26em] uppercase text-[#F2EEE6]">
        MERIDIAN
      </p>
      <p className="mt-1.5 text-[11px] tracking-[0.3em] uppercase text-[#8FA3B8]">
        Chronométrie de Genève · Calibre M-01
      </p>
    </div>
  );
};
