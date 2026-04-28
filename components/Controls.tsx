"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, Pause, RotateCcw, Maximize, Minimize, 
  Volume2, VolumeX, Settings, X, ChevronUp 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSecondsFromHHMMSS, formatTime, loadState, persistState } from "@/utils/time";

interface ControlsProps {
  isActive: boolean;
  isMuted: boolean;
  remainingTime: number;
  initialTime: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (seconds: number) => void;
  toggleMute: () => void;
}

const TimePickerUnit = ({ label, value, onChange, max }: any) => {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <label className="text-[10px] uppercase font-bold text-neutral-500 text-center">{label}</label>
      <input 
        type="number"
        value={value}
        onChange={(e) => {
          let val = parseInt(e.target.value) || 0;
          if (val > max) val = max;
          if (val < 0) val = 0;
          onChange(val);
        }}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-white text-center font-mono text-2xl focus:ring-2 focus:ring-red-600 outline-none"
      />
    </div>
  );
};

export const Controls: React.FC<ControlsProps> = ({
  isActive,
  isMuted,
  start,
  pause,
  reset,
  setTime,
  toggleMute,
  initialTime
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { h, m, s } = formatTime(initialTime);
  const [inputH, setInputH] = useState(h);
  const [inputM, setInputM] = useState(m);
  const [inputS, setInputS] = useState(s);

  useEffect(() => {
    setIsMounted(true);
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-12 left-0 right-0 flex justify-center z-[100] px-4 pointer-events-none">
      <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-4 shadow-2xl pointer-events-auto opacity-40 hover:opacity-100 transition-all duration-300">
        <div className="flex items-center gap-2">
          {!isActive ? (
            <button onClick={start} className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform">
              <Play size={24} fill="currentColor" className="ml-1" />
            </button>
          ) : (
            <button onClick={pause} className="w-14 h-14 flex items-center justify-center bg-neutral-800 text-white rounded-full hover:scale-105 transition-transform">
              <Pause size={24} fill="currentColor" />
            </button>
          )}
          <button onClick={reset} className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white rounded-full">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="w-[1px] h-8 bg-white/10" />

        <div className="flex items-center gap-2 pr-2">
          <button onClick={toggleMute} className="p-3 text-neutral-400 hover:text-white">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
          }} className="p-3 text-neutral-400 hover:text-white">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 flex items-center justify-center bg-red-600/10 text-red-500 rounded-full border border-red-600/20">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">Timer Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <TimePickerUnit label="HH" value={inputH} max={99} onChange={setInputH} />
                  <TimePickerUnit label="MM" value={inputM} max={59} onChange={setInputM} />
                  <TimePickerUnit label="SS" value={inputS} max={59} onChange={setInputS} />
                </div>
                <button 
                  onClick={() => { setTime(getSecondsFromHHMMSS(inputH, inputM, inputS)); setIsSettingsOpen(false); }}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all"
                >
                  Set Time
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
