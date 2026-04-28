"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/utils/time";

interface TimerDisplayProps {
  remainingTime: number;
  isActive: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ remainingTime, isActive }) => {
  const { hh, mm, ss, h } = formatTime(remainingTime);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-center gap-4 md:gap-8 font-black tracking-tighter text-white tabular-nums">
        {h > 0 && (
          <>
            <div className="text-7xl md:text-[12rem] lg:text-[16rem] leading-none">{hh}</div>
            <div className="text-4xl md:text-7xl lg:text-9xl opacity-20 pb-4 md:pb-8">:</div>
          </>
        )}
        <div className="text-7xl md:text-[12rem] lg:text-[16rem] leading-none">{mm}</div>
        <div className="text-4xl md:text-7xl lg:text-9xl opacity-20 pb-4 md:pb-8">:</div>
        <div className="text-7xl md:text-[12rem] lg:text-[16rem] leading-none text-[#FF3B30] drop-shadow-[0_0_50px_rgba(255,59,48,0.3)]">{ss}</div>
      </div>
      
      {remainingTime === 0 && !isActive && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 text-center"
        >
          <div className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-widest">Time Up</div>
          <div className="text-neutral-500 mt-2 uppercase tracking-[0.5em] text-sm font-bold">Hackathon Concluded</div>
        </motion.div>
      )}
    </div>
  );
};
