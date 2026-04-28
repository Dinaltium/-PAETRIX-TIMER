"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, Pause, RotateCcw, Maximize, Minimize, 
  Volume2, VolumeX, Settings, X, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSecondsFromHHMMSS, formatTime, loadState, persistState } from "@/utils/time";

interface ControlsProps {
  isActive: boolean;
  isMuted: boolean;
  remainingTime: number;
  initialTime: number;
  alertSound: string;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (seconds: number) => void;
  toggleMute: () => void;
  updateAlertSound: (url: string) => void;
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
          borderRadius: '20px',
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presets, setPresets] = useState<{name: string, seconds: number}[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [customSoundUrl, setCustomSoundUrl] = useState("");
  const [localSounds, setLocalSounds] = useState<string[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  const fetchLocalSounds = async () => {
    setIsLoadingLocal(true);
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocalSounds(data);
      }
    } catch (e) {
      console.error("Failed to fetch local sounds:", e);
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const soundPresets = [
    { name: "Digital Alert", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
    { name: "Air Horn", url: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3" },
    { name: "Epic Impact", url: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" },
    { name: "Cinematic", url: "https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3" },
  ];

  useEffect(() => {
    setIsMounted(true);
    fetchLocalSounds();
    setPresets(loadState("timer_presets", [
      { name: "Hacking (24h)", seconds: 24 * 3600 },
      { name: "Final Stretch (1h)", seconds: 3600 },
      { name: "Demo (5m)", seconds: 300 },
      { name: "Quick Break (15m)", seconds: 15 * 60 },
    ]));

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const { h, m, s } = formatTime(props.initialTime);
  const [inputH, setInputH] = useState(h);
  const [inputM, setInputM] = useState(m);
  const [inputS, setInputS] = useState(s);
  const [inputName, setInputName] = useState("Custom Timer");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  const testSound = (url: string) => {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play();
  };

  if (!isMounted) return null;

  const showPanel = isHovered || isSettingsOpen;

  return (
    <>
      {/* 
          TRIGGER ZONE 
          Fixed at the bottom, 160px tall.
          This ensures the mouse has to be in the "bottom area" to trigger the UI.
      */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '160px',
          zIndex: 900,
          backgroundColor: 'transparent',
          pointerEvents: 'auto'
        }}
      >
        {/* The Controls Panel - Perfectly Restored Design */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: `translateX(-50%) translateY(${showPanel ? '0' : '120px'})`,
          opacity: showPanel ? 1 : 0,
          backgroundColor: '#111111',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '32px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          transition: 'all 0.5s cubic-bezier(0.2, 0, 0, 1)',
          boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.8)',
          pointerEvents: showPanel ? 'auto' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={props.isActive ? props.pause : props.start}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {props.isActive ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '6px', height: '24px', backgroundColor: '#fff', borderRadius: '2px' }} />
                  <div style={{ width: '6px', height: '24px', backgroundColor: '#fff', borderRadius: '2px' }} />
                </div>
              ) : (
                <Play size={32} fill="currentColor" />
              )}
            </button>
            
            <button onClick={props.reset} style={{ width: '48px', height: '48px', border: 'none', backgroundColor: 'transparent', color: '#999', cursor: 'pointer' }}>
              <RotateCcw size={32} />
            </button>
          </div>

          <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={props.toggleMute} style={{ width: '48px', height: '48px', border: 'none', backgroundColor: 'transparent', color: '#999', cursor: 'pointer' }}>
              {props.isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
            </button>
            <button onClick={toggleFullscreen} style={{ width: '48px', height: '48px', border: 'none', backgroundColor: 'transparent', color: '#999', cursor: 'pointer' }}>
              {isFullscreen ? <Minimize size={32} /> : <Maximize size={32} />}
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(220, 38, 38, 0.05)',
                border: '2px solid rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Settings size={32} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: 'relative',
                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '40px',
                padding: '48px',
                width: '100%',
                maxWidth: '950px',
                boxShadow: '0 100px 200px -50px rgba(0, 0, 0, 1)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
                <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
                {/* Column 1: Presets & Custom Node */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>Presets</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {presets.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => { props.setTime(p.seconds); setIsSettingsOpen(false); }}
                          style={{ padding: '20px', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>{p.name}</div>
                          <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'monospace', marginTop: '4px' }}>
                            {formatTime(p.seconds).hh}:{formatTime(p.seconds).mm}:{formatTime(p.seconds).ss}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '3px' }}>Custom Node</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <TimePickerUnit label="HH" value={inputH} max={99} onChange={setInputH} />
                      <TimePickerUnit label="MM" value={inputM} max={59} onChange={setInputM} />
                      <TimePickerUnit label="SS" value={inputS} max={59} onChange={setInputS} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}
                        placeholder="PRESET NAME"
                      />
                      <button 
                        onClick={() => {
                          const total = getSecondsFromHHMMSS(inputH, inputM, inputS);
                          const newPresets = [...presets, { name: inputName, seconds: total }];
                          setPresets(newPresets);
                          persistState("timer_presets", newPresets);
                        }}
                        style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                    <button 
                      onClick={() => { props.setTime(getSecondsFromHHMMSS(inputH, inputM, inputS)); setIsSettingsOpen(false); }}
                      style={{ width: '100%', height: '64px', backgroundColor: '#fff', color: '#000', borderRadius: '16px', border: 'none', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      Apply Time
                    </button>
                  </div>
                </div>

                {/* Column 2: Sound Alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '3px' }}>Alert Sound</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Presets</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {soundPresets.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => props.updateAlertSound(s.url)}
                            style={{
                              padding: '16px',
                              backgroundColor: props.alertSound === s.url ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255,255,255,0.02)',
                              border: props.alertSound === s.url ? '1px solid #FF3B30' : '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '16px',
                              color: props.alertSound === s.url ? '#fff' : '#888',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.name}</div>
                            <div 
                              onClick={(e) => { e.stopPropagation(); testSound(s.url); }}
                              style={{ fontSize: '9px', textTransform: 'uppercase', color: '#FF3B30', fontWeight: 'bold' }}
                            >
                              ▶ Test
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Local Assets (/public/alerts/)</div>
                        <button 
                          onClick={(e) => { e.preventDefault(); fetchLocalSounds(); }}
                          disabled={isLoadingLocal}
                          style={{ fontSize: '9px', color: '#FF3B30', backgroundColor: 'transparent', border: 'none', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
                        >
                          {isLoadingLocal ? 'Scanning...' : 'Refresh'}
                        </button>
                      </div>
                      
                      {localSounds.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {localSounds.map((filename, i) => {
                            const url = `/alerts/${filename}`;
                            return (
                              <button
                                key={i}
                                onClick={() => props.updateAlertSound(url)}
                                style={{
                                  padding: '16px',
                                  backgroundColor: props.alertSound === url ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255,255,255,0.02)',
                                  border: props.alertSound === url ? '1px solid #FF3B30' : '1px solid rgba(255, 255, 255, 0.05)',
                                  borderRadius: '16px',
                                  color: props.alertSound === url ? '#fff' : '#888',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  transition: 'all 0.2s',
                                  textAlign: 'left'
                                }}
                              >
                                <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{filename}</div>
                                <div 
                                  onClick={(e) => { e.stopPropagation(); testSound(url); }}
                                  style={{ fontSize: '9px', textTransform: 'uppercase', color: '#FF3B30', fontWeight: 'bold' }}
                                >
                                  ▶ Test
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', fontWeight: 'bold' }}>No files found in /public/alerts/</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Custom Sound URL</div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        value={customSoundUrl}
                        onChange={(e) => setCustomSoundUrl(e.target.value)}
                        placeholder="HTTPS://..."
                        style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '12px' }}
                      />
                      <button 
                        onClick={() => { if(customSoundUrl) { props.updateAlertSound(customSoundUrl); testSound(customSoundUrl); } }}
                        style={{ padding: '0 24px', height: '64px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', padding: '24px', backgroundColor: 'rgba(255, 59, 48, 0.05)', borderRadius: '24px', border: '1px solid rgba(255, 59, 48, 0.1)' }}>
                    <div style={{ fontSize: '9px', color: '#FF3B30', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px' }}>Active Selection</div>
                    <div style={{ color: '#fff', fontSize: '11px', wordBreak: 'break-all', opacity: 0.6, fontFamily: 'monospace' }}>{props.alertSound}</div>
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
