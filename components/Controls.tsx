"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Play, Pause, RotateCcw, Maximize, Minimize, 
  Volume2, VolumeX, Settings, X, ChevronUp, Plus, ArrowRight
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
      const delta = Math.floor((startY - e.clientY) / 5); // Faster sensitivity
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
    <div className="flex flex-col gap-3 flex-1 items-center group">
      <span className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] group-hover:text-red-500 transition-colors">{label}</span>
      <div 
        onMouseDown={handleMouseDown}
        onWheel={(e) => {
          const delta = e.deltaY > 0 ? -1 : 1;
          onChange(Math.min(max, Math.max(0, value + delta)));
        }}
        className={`
          w-full aspect-square flex items-center justify-center
          bg-neutral-900 border border-white/5 rounded-2xl
          text-white font-mono text-5xl font-black
          cursor-ns-resize select-none transition-all
          ${isDragging ? 'border-red-600 scale-105 bg-neutral-800 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'hover:border-white/20'}
        `}
      >
        {value.toString().padStart(2, '0')}
      </div>
    </div>
  );
};

const ControlButton = ({ 
  onClick, 
  icon, 
  active = false, 
  danger = false,
  className = ""
}: { 
  onClick: () => void, 
  icon: React.ReactNode, 
  active?: boolean,
  danger?: boolean,
  className?: string
}) => (
  <button 
    onClick={onClick}
    className={`
      w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300
      ${active ? 'bg-white text-black scale-110 shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}
      ${danger ? 'hover:bg-red-600 hover:text-white' : ''}
      ${className}
    `}
  >
    {icon}
  </button>
);

export const Controls: React.FC<ControlsProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presets, setPresets] = useState<{name: string, seconds: number}[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setPresets(loadState("timer_presets", [
      { name: "Hacking (24h)", seconds: 24 * 3600 },
      { name: "Final Stretch (1h)", seconds: 3600 },
      { name: "Demo (5m)", seconds: 300 },
      { name: "Quick Break (15m)", seconds: 15 * 60 },
    ]));
  }, []);

  const { h, m, s } = formatTime(props.initialTime);
  const [inputH, setInputH] = useState(h);
  const [inputM, setInputM] = useState(m);
  const [inputS, setInputS] = useState(s);
  const [inputName, setInputName] = useState("Custom Timer");

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Global Hover Trigger Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-24 z-50 pointer-events-auto"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => !isSettingsOpen && setIsVisible(false)}
      />

      {/* Control Panel Container */}
      <div className={`
        fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] pointer-events-none
        transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isVisible || isSettingsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}>
        <div className="pointer-events-auto bg-neutral-900/80 backdrop-blur-3xl border border-white/10 rounded-full px-3 py-3 flex items-center gap-1 shadow-2xl">
          <ControlButton 
            onClick={props.isActive ? props.pause : props.start} 
            active={props.isActive}
            icon={props.isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />} 
          />
          <ControlButton onClick={props.reset} icon={<RotateCcw size={20} />} />
          
          <div className="w-[1px] h-6 bg-white/10 mx-2" />
          
          <ControlButton onClick={props.toggleMute} icon={props.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} />
          <ControlButton onClick={toggleFullscreen} icon={isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />} />
          <ControlButton 
            onClick={() => setIsSettingsOpen(true)} 
            icon={<Settings size={20} />} 
            className="hover:rotate-90 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white"
          />
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-black border border-white/10 rounded-[3rem] p-12 w-full max-w-2xl shadow-[0_50px_100px_-20px_rgba(220,38,38,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />

              <div className="flex items-start justify-between mb-12">
                <div>
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Settings</h2>
                  <p className="text-neutral-500 font-bold mt-2 uppercase tracking-[0.3em] text-[10px]">Master Configuration Control</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-14 h-14 bg-white/5 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left: Presets */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-l-2 border-red-600 pl-3">Presets</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {presets.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { props.setTime(p.seconds); setIsSettingsOpen(false); }}
                        className="flex items-center justify-between p-5 bg-neutral-900 border border-white/5 rounded-2xl hover:border-red-600/50 hover:bg-neutral-800 transition-all group"
                      >
                        <div>
                          <div className="text-[9px] text-neutral-500 uppercase font-black tracking-widest">{p.name}</div>
                          <div className="text-xl text-white font-mono font-black italic mt-1">
                            {formatTime(p.seconds).hh}:{formatTime(p.seconds).mm}:{formatTime(p.seconds).ss}
                          </div>
                        </div>
                        <ArrowRight size={18} className="text-neutral-700 group-hover:text-red-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Custom */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-l-2 border-red-600 pl-3">Custom Timer</h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <TimePickerUnit label="Hours" value={inputH} max={99} onChange={setInputH} />
                      <TimePickerUnit label="Mins" value={inputM} max={59} onChange={setInputM} />
                      <TimePickerUnit label="Secs" value={inputS} max={59} onChange={setInputS} />
                    </div>

                    <div className="space-y-2">
                      <input 
                        type="text" 
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/5 rounded-2xl p-5 text-white font-bold focus:outline-none focus:border-red-600/50 transition-all text-sm uppercase tracking-widest"
                        placeholder="TIMER LABEL"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => { props.setTime(getSecondsFromHHMMSS(inputH, inputM, inputS)); setIsSettingsOpen(false); }}
                        className="flex-1 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"
                      >
                        Apply
                      </button>
                      <button 
                        onClick={() => {
                          const total = getSecondsFromHHMMSS(inputH, inputM, inputS);
                          const newPresets = [...presets, { name: inputName, seconds: total }];
                          setPresets(newPresets);
                          persistState("timer_presets", newPresets);
                        }}
                        className="w-16 py-5 bg-neutral-900 border border-white/5 text-white rounded-2xl flex items-center justify-center hover:bg-neutral-800 hover:border-red-600/50 transition-all active:scale-95"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
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
