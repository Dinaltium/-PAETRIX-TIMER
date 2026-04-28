"use client";

import React, { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TimerDisplay } from "@/components/TimerDisplay";
import { Controls } from "@/components/Controls";
import { useCountdown } from "@/hooks/useCountdown";
import confetti from "canvas-confetti";
import { Orbitron, Inter } from "next/font/google";

const orbitron = Orbitron({ 
  subsets: ["latin"], 
  weight: ["400", "900"],
  variable: "--font-orbitron" 
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export default function Home() {
  const [isMounted, setIsMounted] = React.useState(false);
  const {
    remainingTime,
    isActive,
    isMuted,
    initialTime,
    start,
    pause,
    reset,
    setTime,
    toggleMute,
  } = useCountdown();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isMounted) return;
    switch(e.key.toLowerCase()) {
      case " ":
        e.preventDefault();
        isActive ? pause() : start();
        break;
      case "r":
        reset();
        break;
      case "f":
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        break;
      case "m":
        toggleMute();
        break;
    }
  }, [isActive, start, pause, reset, toggleMute, isMounted]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle confetti and sound when finished
  useEffect(() => {
    if (!isMounted) return;
    if (remainingTime === 0 && !isActive && initialTime > 0) {
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ffffff", "#FF3B30", "#000000"]
      });

      // Optional sound trigger (if not muted)
      if (!isMuted) {
        console.log("BOOM! Time is up.");
      }
    }
  }, [remainingTime, isActive, initialTime, isMuted, isMounted]);

  // Prevent screen sleep (Wake Lock API)
  useEffect(() => {
    if (!isMounted) return;
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator.wakeLock as any).request("screen");
        }
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
    };

    if (isActive) {
      requestWakeLock();
    }

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isActive, isMounted]);

  if (!isMounted) {
    return (
      <main className={`${orbitron.variable} ${inter.variable} font-sans min-h-screen bg-black flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className={`${orbitron.variable} ${inter.variable} font-sans min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center`}>
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,48,0.03)_0%,transparent_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />
      </div>

      {/* Timer Container with Title */}
      <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center gap-12 p-8 md:p-24">
        {/* Centered Title */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-8">
            <div className="w-24 h-[3px] bg-red-600 shadow-[0_0_20px_rgba(255,59,48,0.8)]" />
            <h1 className="text-white text-2xl md:text-4xl lg:text-6xl uppercase tracking-normal font-black opacity-90 text-center">
              PÆTRIX Hackathon
            </h1>
            <div className="w-24 h-[3px] bg-red-600 shadow-[0_0_20px_rgba(255,59,48,0.8)]" />
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
        </motion.div>

        <TimerDisplay remainingTime={remainingTime} isActive={isActive} />
      </div>

      {/* Sponsor Logo Slot */}
      <div className="absolute bottom-12 right-12 z-10 opacity-30 hover:opacity-100 transition-opacity duration-500">
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] uppercase tracking-normal text-neutral-500">Powered by</span>
          <div className="w-36 h-12 border border-neutral-800 rounded-lg flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm">
            <span className="text-white font-black italic tracking-normal text-lg">PÆTRIX</span>
          </div>
        </div>
      </div>

      {/* Progress Bar at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-2 bg-neutral-900/30 z-20">
        <motion.div 
          className="h-full bg-red-600 shadow-[0_-4px_15px_rgba(220,38,38,0.4)]"
          initial={{ width: "100%" }}
          animate={{ width: `${(remainingTime / (initialTime || 1)) * 100}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      {/* Controls Overlay */}
      <Controls 
        isActive={isActive}
        isMuted={isMuted}
        remainingTime={remainingTime}
        initialTime={initialTime}
        start={start}
        pause={pause}
        reset={reset}
        setTime={setTime}
        toggleMute={toggleMute}
      />

      {/* Aesthetic Border Accents */}
      <div className="fixed top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-800 to-transparent opacity-20" />
      <div className="fixed bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-800 to-transparent opacity-20" />
    </main>
  );
}
