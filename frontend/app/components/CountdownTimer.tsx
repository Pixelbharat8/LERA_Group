"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const { t } = useLanguage();
  
  // Set target date to end of current month
  const getTargetDate = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return endOfMonth;
  };

  const calculateTimeLeft = (): TimeLeft => {
    const difference = getTargetDate().getTime() - new Date().getTime();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center space-x-4">
        {[0, 0, 0, 0].map((_, i) => (
          <div key={i} className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 min-w-[70px]">
              <span className="text-3xl font-bold text-white">00</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: t("days") },
    { value: timeLeft.hours, label: t("timerHours") },
    { value: timeLeft.minutes, label: t("minutes") },
    { value: timeLeft.seconds, label: t("seconds") },
  ];

  return (
    <div className="flex justify-center space-x-4">
      {timeUnits.map((unit, index) => (
        <div key={index} className="text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 min-w-[70px]">
            <span className="text-3xl font-bold text-white">
              {unit.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-white/80 text-sm mt-1 block">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
