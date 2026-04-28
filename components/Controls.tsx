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
      const delta = Math.floor((startY - e.clientY) / 8);
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

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -1 : 1;
    let newValue = value + delta;
    if (newValue < 0) newValue = 0;
    if (newValue > max) newValue = max;
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2 flex-1">
      <label className="text-[10px] uppercase tracking-normal text-neutral-500 text-center block font-bold">{label}</label>
      <div 
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        className="relative group cursor-ns-resize select-none"
      >
        <div className="w-full bg-neutral-800/40 border border-neutral-700/50 rounded-2xl p-4 text-white font-mono text-3xl text-center transition-all hover:bg-neutral-800 hover:border-neutral-500 group-hover:scale-[1.02] active:scale-95 active:bg-neutral-700">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="absolute inset-y-0 right-3 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ChevronUp size={12} className="text-red-500/50" />
          <ChevronUp size={12} className="text-red-500/50 rotate-180" />
        </div>
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
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presets, setPresets] = useState<{name: string, seconds: number}[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    const savedPresets = loadState("timer_presets", [
      { name: "Hacking (24h)", seconds: 24 * 3600 },
      { name: "Final Stretch (1h)", seconds: 3600 },
      { name: "Demo (5m)", seconds: 300 },
      { name: "Quick Break (15m)", seconds: 15 * 60 },
    ]);
    setPresets(savedPresets);
  }, []);

  const { h, m, s } = formatTime(initialTime);
  const [inputH, setInputH] = useState(h);
  const [inputM, setInputM] = useState(m);
  const [inputS, setInputS] = useState(s);
  const [inputName, setInputName] = useState("Custom Timer");

  useEffect(() => {
    if (typeof document === 'undefined') return;
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
      {/* GLOBAL HOVER TRIGGER (Minimal height to prevent blocking clicks) */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-10 z-[90] pointer-events-auto"
        onMouseEnter={() => setIsVisible(true)}
      />

      <div 
        className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none flex flex-col items-center"
        onMouseLeave={() => !isSettingsOpen && setIsVisible(false)}
      >
        <div className="relative flex flex-col items-center justify-end pb-20 w-full h-48">
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.9 }}
                className="pointer-events-auto bg-neutral-900/95 backdrop-blur-3xl border border-white/10 rounded-full px-8 py-4 flex items-center gap-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
              >
                <div className="flex items-center gap-6">
                  {!isActive ? (
                    <button 
                      onClick={start}
                      className="w-20 h-20 flex items-center justify-center bg-white text-black rounded-full hover:bg-neutral-200 transition-all hover:scale-110 active:scale-90 shadow-xl"
                    >
                      <Play size={40} fill="currentColor" className="ml-1" />
                    </button>
                  ) : (
                    <button 
                      onClick={pause}
                      className="w-20 h-20 flex items-center justify-center bg-neutral-800 text-white rounded-full hover:bg-neutral-700 transition-all hover:scale-110 active:scale-90 border border-neutral-700"
                    >
                      <Pause size={40} fill="currentColor" />
                    </button>
                  )}
                  <button 
                    onClick={reset}
                    className="w-16 h-16 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all group/reset"
                    title="Reset Timer"
                  >
                    <RotateCcw size={32} className="group-active/reset:rotate-[-180deg] transition-transform duration-500" />
                  </button>
                </div>

                <div className="h-12 w-[1px] bg-neutral-800" />

                <div className="flex items-center gap-6">
                  <button 
                    onClick={toggleMute}
                    className="w-16 h-16 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all"
                  >
                    {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
                  </button>
                  <button 
                    onClick={toggleFullscreen}
                    className="w-16 h-16 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all"
                  >
                    {isFullscreen ? <Minimize size={32} /> : <Maximize size={32} />}
                  </button>
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-16 h-16 flex items-center justify-center bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-all border border-red-600/20 shadow-lg shadow-red-600/10"
                  >
                    <Settings size={32} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isVisible && !isSettingsOpen && (
            <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-10 transition-opacity group-hover:opacity-30">
               <ChevronUp size={20} className="text-neutral-500" />
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal - Centered Fixed */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-neutral-900 border border-neutral-800 rounded-[3rem] p-10 w-full max-w-[550px] shadow-[0_50px_100px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight uppercase italic">Control Center</h3>
                  <p className="text-neutral-500 text-sm mt-1">Configure your hackathon session presets.</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-4">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { setTime(p.seconds); setIsSettingsOpen(false); }}
                      className="p-5 text-left bg-neutral-800/50 hover:bg-neutral-800 rounded-2xl transition-all border border-neutral-700/30 group/item"
                    >
                      <div className="text-[10px] text-neutral-500 uppercase font-black tracking-widest group-hover/item:text-red-500 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-2xl text-white font-mono mt-1">
                        {formatTime(p.seconds).hh}:{formatTime(p.seconds).mm}:{formatTime(p.seconds).ss}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="h-[1px] bg-neutral-800" />

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Session Label</label>
                    <input 
                      type="text" 
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="e.g. FINAL PITCHES"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all"
                    />
                  </div>

                  <div className="flex gap-6">
                    <TimePickerUnit label="HOURS" value={inputH} max={99} onChange={setInputH} />
                    <TimePickerUnit label="MINS" value={inputM} max={59} onChange={setInputM} />
                    <TimePickerUnit label="SECS" value={inputS} max={59} onChange={setInputS} />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={handleApplyTime}
                      className="flex-1 py-5 bg-neutral-100 text-black font-black rounded-2xl hover:bg-white transition-all transform active:scale-[0.95] uppercase tracking-widest text-xs"
                    >
                      Set Time
                    </button>
                    <button 
                      onClick={handleAddPreset}
                      className="flex-1 py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-500 transition-all transform active:scale-[0.95] shadow-lg shadow-red-600/20 uppercase tracking-widest text-xs"
                    >
                      Save Preset
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
