"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Play, Pause, RotateCcw, Maximize, Minimize, 
  Volume2, VolumeX, Settings, X, ChevronUp, Plus
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

const TimePickerUnit = ({ 
  label, 
  value, 
  onChange, 
  max 
}: { 
  label: string, 
  value: number, 
  onChange: (val: number) => void,
  max: number 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
    document.body.style.cursor = 'ns-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = Math.floor((startY - e.clientY) / 10);
      let newValue = startValue + delta;
      if (newValue < 0) newValue = 0;
      if (newValue > max) newValue = max;
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startValue, max, onChange]);

  return (
    <div className="flex flex-col gap-2 flex-1 items-center">
      <span className="text-[10px] uppercase font-black text-neutral-500 tracking-widest">{label}</span>
      <div 
        onMouseDown={handleMouseDown}
        onWheel={(e) => {
          const delta = e.deltaY > 0 ? -1 : 1;
          const newValue = Math.min(max, Math.max(0, value + delta));
          onChange(newValue);
        }}
        className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl py-6 px-4 text-white font-mono text-4xl text-center cursor-ns-resize hover:bg-neutral-800 hover:border-red-600/30 transition-all active:scale-95 select-none shadow-inner"
      >
        {value.toString().padStart(2, '0')}
      </div>
    </div>
  );
};

export const Controls: React.FC<ControlsProps> = ({
  isActive,
  isMuted,
  remainingTime,
  initialTime,
  start,
  pause,
  reset,
  setTime,
  toggleMute,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presets, setPresets] = useState<{name: string, seconds: number}[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedPresets = loadState("timer_presets", [
      { name: "Hacking (24h)", seconds: 24 * 3600 },
      { name: "Final Stretch (1h)", seconds: 3600 },
      { name: "Demo (5m)", seconds: 300 },
      { name: "Quick Break (15m)", seconds: 15 * 60 },
    ]);
    setPresets(savedPresets);
    setIsMounted(true);
  }, []);

  const { h, m, s } = formatTime(initialTime);
  const [inputH, setInputH] = useState(h);
  const [inputM, setInputM] = useState(m);
  const [inputS, setInputS] = useState(s);
  const [inputName, setInputName] = useState("Custom Timer");

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleApplyTime = () => {
    const total = getSecondsFromHHMMSS(inputH, inputM, inputS);
    setTime(total);
    setIsSettingsOpen(false);
  };

  const handleAddPreset = () => {
    const total = getSecondsFromHHMMSS(inputH, inputM, inputS);
    const newPresets = [...presets, { name: inputName, seconds: total }];
    setPresets(newPresets);
    persistState("timer_presets", newPresets);
    setTime(total);
    setIsSettingsOpen(false);
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Control Panel: Bottom-anchored with hover trigger */}
      <div className="fixed bottom-0 left-0 right-0 h-32 z-50 pointer-events-none group flex items-end justify-center pb-8">
        {/* Invisible Hover Trigger Zone */}
        <div className="absolute inset-0 pointer-events-auto" />
        
        {/* The Panel UI */}
        <div className={`
          pointer-events-auto
          bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-full px-8 py-4 flex items-center gap-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]
          transition-all duration-500 ease-out transform
          ${isSettingsOpen ? 'opacity-0 translate-y-12' : 'opacity-0 translate-y-12 group-hover:opacity-100 group-hover:translate-y-0'}
        `}>
          <div className="flex items-center gap-4">
            {!isActive ? (
              <button 
                onClick={start}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-xl"
              >
                <Play size={28} fill="currentColor" />
              </button>
            ) : (
              <button 
                onClick={pause}
                className="w-14 h-14 bg-neutral-800 text-white rounded-full flex items-center justify-center hover:bg-neutral-700 transition-all hover:scale-110 active:scale-95 border border-white/10"
              >
                <Pause size={28} fill="currentColor" />
              </button>
            )}
            <button 
              onClick={reset}
              className="p-3 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Reset"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMute}
              className="p-3 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-3 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all hover:rotate-90 active:scale-90"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>

        {/* Hint icon when hidden */}
        <div className={`absolute bottom-4 text-neutral-800 transition-opacity duration-300 pointer-events-none ${isSettingsOpen ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
          <ChevronUp size={24} />
        </div>
      </div>

      {/* Settings Modal: Centered and full-screen overlay */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-neutral-900 border border-white/10 rounded-[2.5rem] p-10 w-full max-w-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] pointer-events-none" />

              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Timer Studio</h2>
                  <p className="text-neutral-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Configure your stage display</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-12 h-12 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10">
                {/* Presets Grid */}
                <div>
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Quick Presets</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {presets.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { setTime(p.seconds); setIsSettingsOpen(false); }}
                        className="p-5 text-left bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 group"
                      >
                        <div className="text-[10px] text-neutral-500 uppercase font-black tracking-widest group-hover:text-red-500 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-2xl text-white font-mono mt-1 font-black italic">
                          {formatTime(p.seconds).hh}:{formatTime(p.seconds).mm}:{formatTime(p.seconds).ss}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[1px] bg-white/5" />

                {/* Custom Configuration */}
                <div className="space-y-8">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Custom Display Name</label>
                    <input 
                      type="text" 
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all placeholder:text-neutral-700"
                      placeholder="e.g. FINAL PITCHING"
                    />
                  </div>

                  <div className="flex gap-6">
                    <TimePickerUnit label="Hours" value={inputH} max={99} onChange={setInputH} />
                    <TimePickerUnit label="Minutes" value={inputM} max={59} onChange={setInputM} />
                    <TimePickerUnit label="Seconds" value={inputS} max={59} onChange={setInputS} />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={handleApplyTime}
                      className="flex-1 py-6 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neutral-200 transition-all active:scale-95 shadow-xl"
                    >
                      Apply Now
                    </button>
                    <button 
                      onClick={handleAddPreset}
                      className="w-20 py-6 bg-red-600 text-white rounded-2xl flex items-center justify-center hover:bg-red-500 transition-all active:scale-95 shadow-xl shadow-red-600/20"
                    >
                      <Plus size={28} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
