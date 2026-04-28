"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, Pause, RotateCcw, Maximize, Minimize, 
  Volume2, VolumeX, Settings, X, Plus, ChevronUp
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
  return (
    <div className="flex flex-col gap-2 flex-1 items-center">
      <span style={{ fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</span>
      <div 
        onWheel={(e) => {
          const delta = e.deltaY > 0 ? -1 : 1;
          onChange(Math.min(max, Math.max(0, value + delta)));
        }}
        style={{
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px 12px',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '48px',
          fontWeight: '900',
          textAlign: 'center',
          cursor: 'ns-resize',
          userSelect: 'none'
        }}
      >
        {value.toString().padStart(2, '0')}
      </div>
    </div>
  );
};

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

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    // Auto-hide mouse and UI if inactive
    let hideTimeout: any;
    const handleMove = () => {
      setIsVisible(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (!isSettingsOpen) setIsVisible(false);
      }, 3000);
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [isSettingsOpen]);

  const { h, m, s } = formatTime(props.initialTime);
  const [inputH, setInputH] = useState(h);
  const [inputM, setInputM] = useState(m);
  const [inputS, setInputS] = useState(s);
  const [inputName, setInputName] = useState("Custom Timer");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Cinematic Control Bar - Uses Inline Styles for Build Stability */}
      <div style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: `translateX(-50%) translateY(${isVisible || isSettingsOpen ? '0' : '100px'})`,
        opacity: isVisible || isSettingsOpen ? 1 : 0,
        backgroundColor: 'rgba(15, 15, 15, 0.9)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '9999px',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        zIndex: 1000,
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={props.isActive ? props.pause : props.start}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: props.isActive ? 'rgba(255, 255, 255, 0.1)' : '#fff',
              color: props.isActive ? '#fff' : '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {props.isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>
          
          <button 
            onClick={props.reset}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <RotateCcw size={24} />
          </button>
        </div>

        <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={props.toggleMute}
            style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#999' }}
          >
            {props.isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          
          <button 
            onClick={toggleFullscreen}
            style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#999' }}
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 59, 48, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(20px)' }}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: 'relative',
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '40px',
                padding: '48px',
                width: '100%',
                maxWidth: '800px',
                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '40px' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: '#fff', fontSize: '48px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-2px' }}>Timer Studio</h2>
                  <p style={{ color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '10px' }}>Configuration Node</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '48px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#999', textTransform: 'uppercase', letterSpacing: '2px', borderLeft: '3px solid #FF3B30', paddingLeft: '12px' }}>Presets</h3>
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { props.setTime(p.seconds); setIsSettingsOpen(false); }}
                      style={{
                        padding: '20px',
                        textAlign: 'left',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '20px',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontWeight: '900' }}>{p.name}</div>
                      <div style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace', marginTop: '4px' }}>
                        {formatTime(p.seconds).hh}:{formatTime(p.seconds).mm}:{formatTime(p.seconds).ss}
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#999', textTransform: 'uppercase', letterSpacing: '2px', borderLeft: '3px solid #FF3B30', paddingLeft: '12px' }}>Custom Node</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <TimePickerUnit label="HR" value={inputH} max={99} onChange={setInputH} />
                    <TimePickerUnit label="MIN" value={inputM} max={59} onChange={setInputM} />
                    <TimePickerUnit label="SEC" value={inputS} max={59} onChange={setInputS} />
                  </div>

                  <input 
                    type="text" 
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '20px',
                      padding: '20px',
                      color: '#fff',
                      fontWeight: '900',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
                    }}
                    placeholder="LABEL"
                  />

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => { props.setTime(getSecondsFromHHMMSS(inputH, inputM, inputS)); setIsSettingsOpen(false); }}
                      style={{ flex: 1, padding: '24px', backgroundColor: '#fff', color: '#000', borderRadius: '20px', border: 'none', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer' }}
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
                      style={{ width: '80px', height: '80px', backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justify: 'center' }}
                    >
                      <Plus size={32} />
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
