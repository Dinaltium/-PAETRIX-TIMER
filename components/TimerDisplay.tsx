"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/utils/time";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimerDisplayProps {
  remainingTime: number;
  isActive: boolean;
}

const Digit = ({ value, color = "white", label }: { value: string; color?: "white" | "red"; label?: string }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative py-4 md:py-8 overflow-visible">
        <motion.div
          key={value}
          initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "text-[18vw] md:text-[22vw] font-black leading-[0.7] tracking-tighter tabular-nums select-none",
            color === "white" ? "text-white" : "text-[#FF3B30] drop-shadow-[0_0_8vw_rgba(255,59,48,0.5)]"
          )}
        >
          {value}
        </motion.div>
      </div>
      {label && (
        <span className="text-[1.5vw] uppercase tracking-normal text-neutral-500 font-bold mt-[-1vw]">
          {label}
        </span>
      )}
    </div>
  );
};

const Separator = ({ color = "red" }: { color?: "white" | "red" }) => (
  <div className={cn(
    "text-[12vw] md:text-[14vw] font-thin opacity-20 mt-[-4vw] select-none",
    color === "white" ? "text-white" : "text-[#FF3B30]"
  )}>
    :
  </div>
);

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ remainingTime, isActive }) => {
  const { h, m, s, hh, mm, ss } = formatTime(remainingTime);
  const [urgency, setUrgency] = useState(0);

  useEffect(() => {
    if (remainingTime <= 10 && remainingTime > 0 && isActive) {
      setUrgency(1);
    } else {
      setUrgency(0);
    }
  }, [remainingTime, isActive]);

  const urgencyVariants = {
    normal: { scale: 1, filter: "blur(0px)" },
    urgent: { 
      scale: [1, 1.05, 1],
      transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const isOnlySeconds = h === 0 && m === 0;
  const isOnlyMinutes = h === 0 && m > 0;

  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-visible px-12">
      <motion.div
        animate={urgency ? "urgent" : "normal"}
        variants={urgencyVariants}
        className="flex items-center justify-center gap-6 md:gap-12 lg:gap-16"
      >
        <AnimatePresence mode="popLayout">
          {h > 0 && (
            <motion.div
              key="hours"
              initial={{ x: -100, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ y: -100, opacity: 0, filter: "blur(20px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 md:gap-8 lg:gap-12"
            >
              <Digit value={hh} color="white" label="Hours" />
              <Separator color="white" />
            </motion.div>
          )}

          {!isOnlySeconds && (
            <motion.div
              key="minutes"
              layout
              className="flex items-center gap-4 md:gap-8 lg:gap-12"
            >
              <Digit 
                value={mm} 
                color={h === 0 ? "white" : "red"} 
                label={isOnlyMinutes ? "Minutes" : undefined} 
              />
              <Separator color={h === 0 ? "white" : "red"} />
            </motion.div>
          )}

          <motion.div
            key="seconds"
            layout
            className={cn(
              "flex items-center justify-center",
              isOnlySeconds && "scale-125"
            )}
          >
            <Digit 
              value={ss} 
              color={isOnlySeconds ? "white" : "red"} 
              label={isOnlySeconds ? "Seconds" : undefined}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Finished State Overlay */}
      <AnimatePresence>
        {remainingTime === 0 && !isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-10"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-[10vw] md:text-[15vw] font-black text-white tracking-tighter leading-none">
                TIME UP
              </h2>
              <p className="text-[2vw] md:text-[1.5vw] text-neutral-400 uppercase tracking-[1em] mt-[2vw]">
                Hackathon Concluded
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
