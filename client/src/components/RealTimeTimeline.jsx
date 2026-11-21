import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function RealTimeTimeline({
  startedAt,
  estimatedDuration = 30,
  status = 'In chair',
  compact = false
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(startedAt).getTime();
    const updateElapsed = () => {
      const sec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(sec);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const totalEstSeconds = (estimatedDuration || 30) * 60;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / totalEstSeconds) * 100));

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeHM = (dateInput) => {
    if (!dateInput) return '--:--';
    const d = new Date(dateInput);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const startTimeStr = startedAt ? formatTimeHM(startedAt) : '--:--';
  const finishTimeStr = startedAt
    ? formatTimeHM(new Date(new Date(startedAt).getTime() + totalEstSeconds * 1000))
    : '--:--';

  const isOvertime = elapsedSeconds > totalEstSeconds;

  if (compact) {
    return (
      <div className="space-y-1.5 w-full bg-[#F7F3EE] p-3 rounded-full border border-[#E4DBD0]">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1A18] px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1C1A18] animate-ping"></span>
            <span>Live: {formatTimer(elapsedSeconds)}</span>
          </span>
          <span className="text-[#4A4540]">Est. {estimatedDuration}m</span>
        </div>
        <div className="w-full h-1.5 bg-[#E4DBD0] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOvertime ? 'bg-[#ef4444]' : 'bg-[#1C1A18]'
            }`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F7F3EE] p-4 rounded-[28px] border border-[#E4DBD0] space-y-3">
      {/* Header bar with pill ticker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1C1A18] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1C1A18]"></span>
          </span>
          <span className="text-xs font-black text-[#1C1A18] uppercase tracking-wider">
            In Chair Real-Time Timeline
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#1C1A18] text-[#F7F3EE] px-3 py-1 rounded-full shadow-xs">
          <Icon icon="solar:stopwatch-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
          <span className="text-xs font-mono font-black">
            {formatTimer(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Progress Bar Capsule */}
      <div className="relative">
        <div className="w-full h-2.5 bg-[#E4DBD0] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOvertime ? 'bg-[#ef4444]' : 'bg-[#1C1A18]'
            }`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 3 Step Timeline Milestones in Pills */}
      <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
        {/* Step 1: Seated */}
        <div className="flex flex-col items-start bg-[#FFFFFF] p-2 rounded-2xl border border-[#E4DBD0]">
          <div className="flex items-center gap-1 text-[#1C1A18] font-bold">
            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 text-[#1C1A18]" />
            <span>Seated</span>
          </div>
          <span className="text-[#4A4540] font-mono mt-0.5">{startTimeStr}</span>
        </div>

        {/* Step 2: In Progress */}
        <div className="flex flex-col items-center text-center bg-[#FFFFFF] p-2 rounded-2xl border border-[#E4DBD0]">
          <div className="flex items-center gap-1 text-[#1C1A18] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C1A18]"></span>
            <span>Elapsed</span>
          </div>
          <span className="text-[#1C1A18] font-mono font-bold mt-0.5">
            {Math.floor(elapsedSeconds / 60)}m / {estimatedDuration}m
          </span>
        </div>

        {/* Step 3: Completion */}
        <div className="flex flex-col items-end text-right bg-[#FFFFFF] p-2 rounded-2xl border border-[#E4DBD0]">
          <div className="flex items-center gap-1 text-[#4A4540] font-bold">
            <Icon icon="solar:clock-circle-bold" className="w-3.5 h-3.5 text-[#4A4540]" />
            <span>Finish</span>
          </div>
          <span className="text-[#4A4540] font-mono mt-0.5">~{finishTimeStr}</span>
        </div>
      </div>
    </div>
  );
}
