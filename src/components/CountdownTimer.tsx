import React, { useState, useEffect } from 'react';
import { EVENT_DETAILS } from '../data/games';
import { Clock, AlertCircle } from 'lucide-react';

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = EVENT_DETAILS.eventTimestamp - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-carnival-maroon/10 via-carnival-gold/15 to-carnival-maroon/10 border border-carnival-gold/30 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-carnival-maroon text-carnival-gold flex items-center justify-center shadow-sm">
          <Clock className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-carnival-maroon dark:text-carnival-gold">
            Countdown to Grand Opening
          </div>
          <div className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {EVENT_DETAILS.eventDate} • 11:00 AM
          </div>
        </div>
      </div>

      {timeLeft.isExpired ? (
        <div className="flex items-center gap-2 text-emerald-600 font-semibold px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300">
          <AlertCircle className="w-4 h-4" /> The Carnival is Live!
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3">
          {[
            { label: 'Days', val: timeLeft.days },
            { label: 'Hours', val: timeLeft.hours },
            { label: 'Mins', val: timeLeft.minutes },
            { label: 'Secs', val: timeLeft.seconds }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[50px] sm:min-w-[56px] py-1.5 px-2 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-base sm:text-lg font-bold font-mono text-carnival-maroon dark:text-carnival-gold">
                {String(item.val).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-stone-500 dark:text-stone-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
