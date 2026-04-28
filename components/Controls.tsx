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
  const [presets, setPresets] = useState<{name: string, seconds: number}[]>(() => 
    loadState("timer_presets", [
      { name: "Hacking (24h)", seconds: 24 * 3600 },
      { name: "Final Stretch (1h)", seconds: 3600 },
      { name: "Demo (5m)", seconds: 300 },
      { name: "Quick Break (15m)", seconds: 15 * 60 },
    ])
  );

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

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-8 flex justify-center group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => !isSettingsOpen && setIsVisible(false)}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/50 rounded-2xl p-4 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-2">
              {!isActive ? (
                <button 
                  onClick={start}
                  className="p-4 bg-white text-black rounded-full hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Play size={24} fill="currentColor" />
                </button>
              ) : (
                <button 
                  onClick={pause}
                  className="p-4 bg-neutral-800 text-white rounded-full hover:bg-neutral-700 transition-all hover:scale-105 active:scale-95 border border-neutral-700"
                >
                  <Pause size={24} fill="currentColor" />
                </button>
              )}
              <button 
                onClick={reset}
                className="p-4 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all group/reset"
                title="Reset Timer"
              >
                <RotateCcw size={24} className="group-active/reset:rotate-[-180deg] transition-transform duration-500" />
              </button>
            </div>

            <div className="h-10 w-[1px] bg-neutral-800/50" />

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className="p-4 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <button 
                onClick={toggleFullscreen}
                className="p-4 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all"
              >
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-4 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-all border border-red-600/20"
              >
                <Settings size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-28 bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-[450px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Configure Timers</h3>
                <p className="text-neutral-500 text-sm mt-1">Select a preset or create a custom one.</p>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-neutral-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Presets List */}
              <div className="grid grid-cols-2 gap-3">
                {presets.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { setTime(p.seconds); setIsSettingsOpen(false); }}
                    className="p-3 text-left bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all border border-neutral-700/50 group"
                  >
                    <div className="text-xs text-neutral-500 uppercase tracking-normal group-hover:text-neutral-300 transition-colors">
                      {p.name}
                    </div>
                    <div className="text-white font-mono mt-1">
                      {formatTime(p.seconds).hh}:{formatTime(p.seconds).mm}:{formatTime(p.seconds).ss}
                    </div>
                  </button>
                ))}
              </div>

              <div className="h-[1px] bg-neutral-800" />

              {/* Custom Input */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-normal text-neutral-500 ml-1 font-bold">Timer Label</label>
                  <input 
                    type="text" 
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="e.g. Lunch Break"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all"
                  />
                </div>

                <div className="flex gap-4">
                  <TimePickerUnit label="H" value={inputH} max={99} onChange={setInputH} />
                  <TimePickerUnit label="M" value={inputM} max={59} onChange={setInputM} />
                  <TimePickerUnit label="S" value={inputS} max={59} onChange={setInputS} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleApplyTime}
                    className="flex-1 py-4 bg-neutral-100 text-black font-bold rounded-xl hover:bg-white transition-all transform active:scale-[0.98]"
                  >
                    Set Once
                  </button>
                  <button 
                    onClick={handleAddPreset}
                    className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all transform active:scale-[0.98] shadow-lg shadow-red-600/20"
                  >
                    Save Preset
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isVisible && (
        <div className="absolute bottom-4 text-neutral-800 group-hover:text-neutral-600 transition-colors pointer-events-none">
          <ChevronUp size={24} />
        </div>
      )}
    </div>
  );
};
