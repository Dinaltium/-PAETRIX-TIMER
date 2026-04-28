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
      <div className="relative py-8 md:py-12 overflow-visible">
        <motion.div
          key={value}
          initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "text-[10rem] md:text-[15rem] lg:text-[20rem] font-black leading-[0.8] tracking-tighter tabular-nums select-none",
            color === "white" ? "text-white" : "text-[#FF3B30] drop-shadow-[0_0_80px_rgba(255,59,48,0.5)]"
          )}
        >
          {value}
        </motion.div>
      </div>
      {label && (
        <span className="text-xs md:text-sm uppercase tracking-normal text-neutral-500 font-bold mt-[-1rem]">
          {label}
        </span>
      )}
    </div>
  );
};

const Separator = ({ color = "red" }: { color?: "white" | "red" }) => (
  <div className={cn(
    "text-[6rem] md:text-[10rem] lg:text-[14rem] font-thin opacity-20 mt-[-2rem] select-none",
    color === "white" ? "text-white" : "text-[#FF3B30]"
  )}>
    :
  </div>
);

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ remainingTime, isActive }) => {
  const { h, m, s, hh, mm, ss } = formatTime(remainingTime);
  const [urgency, setUrgency] = useState(0); // 0 to 1

  useEffect(() => {
    if (remainingTime <= 10 && remainingTime > 0 && isActive) {
      setUrgency(1);
    } else {
      setUrgency(0);
    }
  }, [remainingTime, isActive]);

  // Final 10 seconds urgency animation
  const urgencyVariants = {
    normal: { scale: 1, filter: "blur(0px)" },
    urgent: { 
      scale: [1, 1.05, 1],
      transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" as const }
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
              isOnlySeconds && "scale-150"
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

      {/* Glow Effect Layer */}
      {urgency > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,48,0.15)_0%,transparent_70%)] pointer-events-none"
        />
      )}

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
              <h2 className="text-[10rem] md:text-[15rem] font-black text-white tracking-tighter leading-none">
                TIME UP
              </h2>
              <p className="text-xl md:text-2xl text-neutral-400 uppercase tracking-[1em] mt-4">
                Hackathon Concluded
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
