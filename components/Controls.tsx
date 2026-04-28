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
  triggers: {time: number, soundUrl: string}[];
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (seconds: number) => void;
  toggleMute: () => void;
  updateAlertSound: (url: string) => void;
  addTrigger: (time: number, soundUrl: string) => void;
  removeTrigger: (index: number) => void;
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
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const nextValue = Math.min(max, Math.max(0, value + delta));
      onChange(nextValue);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [value, onChange, max]);

  return (
    <div className="flex flex-col gap-2 flex-1 items-center">
      <span style={{ fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</span>
      <input
        ref={inputRef}
        type="text"
        value={value.toString().padStart(2, '0')}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          if (val === '') {
            onChange(0);
            return;
          }
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            onChange(Math.min(max, Math.max(0, num)));
          }
        }}
        onFocus={(e) => e.target.select()}
        style={{
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px 12px',
          color: '#fff',
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontSize: '48px',
          fontWeight: '900',
          textAlign: 'center',
          cursor: 'ns-resize',
          outline: 'none',
          transition: 'all 0.2s'
        }}
      />
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

  // Scheduled trigger inputs
  const [triggerH, setTriggerH] = useState(0);
  const [triggerM, setTriggerM] = useState(0);
  const [triggerS, setTriggerS] = useState(0);
  const [triggerSound, setTriggerSound] = useState("");
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);

  const fetchLocalSounds = async () => {
    setIsLoadingLocal(true);
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocalSounds(data);
        if (!triggerSound && data.length > 0) setTriggerSound(`/alerts/${data[0]}`);
      }
    } catch (e) {
      console.error("Failed to fetch local sounds:", e);
    } finally {
      setIsLoadingLocal(false);
    }
  };

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

  const validateAudioUrl = (url: string) => {
    if (!url) return true;
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isDrive = url.includes('drive.google.com');
    const isMyInstantsPage = url.includes('myinstants.com') && !url.toLowerCase().endsWith('.mp3');

    if (isYouTube || isDrive) {
      alert("YouTube and Google Drive links are not direct audio files. Please use a direct link (ending in .mp3, .wav, etc.) or use one of the local assets.");
      return false;
    }

    if (isMyInstantsPage) {
      alert("Tip for MyInstants: Right-click the 'Download MP3' button on the MyInstants page and select 'Copy link address'. Paste THAT link here for it to work!");
      return false;
    }
    
    return true;
  };

  const testSound = (url: string) => {
    if (!validateAudioUrl(url)) return;
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(e => {
      console.error("Playback failed:", e);
      alert("Playback failed. This URL might not be a direct audio file or is blocked by CORS.");
    });
  };

  const handleAddTrigger = React.useCallback(() => {
    const total = getSecondsFromHHMMSS(triggerH, triggerM, triggerS);
    if (total > props.initialTime) {
      alert("Trigger time cannot exceed timer duration!");
      return;
    }
    const sound = customSoundUrl || triggerSound;
    if (!sound) {
      alert("Please select or paste a sound!");
      return;
    }
    if (!validateAudioUrl(sound)) return;
    props.addTrigger(total, sound);
    setCustomSoundUrl("");
    setIsAddingTrigger(false);
  }, [triggerH, triggerM, triggerS, props.initialTime, customSoundUrl, triggerSound, props.addTrigger]);

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
                width: '100%',
                maxWidth: '950px',
                boxShadow: '0 100px 200px -50px rgba(0, 0, 0, 1)',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden' // CLIPS THE SCROLLBAR
              }}
            >
              {/* Inner Scrollable Content */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '48px',
                // Custom scrollbar classes for this container
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
              }} className="custom-scrollbar">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                    <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>Settings</h2>
                    {props.isActive && (
                      <div style={{ color: '#FF3B30', fontFamily: 'var(--font-orbitron), monospace', fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>
                        {formatTime(props.remainingTime).hh}:{formatTime(props.remainingTime).mm}:{formatTime(props.remainingTime).ss}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={24} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
                  {/* Column 1: Presets & Custom Timer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
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
                            <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-orbitron), monospace', marginTop: '4px' }}>
                              {formatTime(p.seconds).hh}:{formatTime(p.seconds).mm}:{formatTime(p.seconds).ss}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '3px' }}>Custom Timer</h3>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <TimePickerUnit label="HH" value={inputH} max={99} onChange={setInputH} />
                        <TimePickerUnit label="MM" value={inputM} max={59} onChange={setInputM} />
                        <TimePickerUnit label="SS" value={inputS} max={59} onChange={setInputS} />
                      </div>
                      <button 
                        onClick={() => { props.setTime(getSecondsFromHHMMSS(inputH, inputM, inputS)); setIsSettingsOpen(false); }}
                        style={{ width: '100%', height: '64px', backgroundColor: '#fff', color: '#000', borderRadius: '16px', border: 'none', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Apply Time
                      </button>
                    </div>
                  </div>

                  {/* Column 2: Scheduled Alerts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '3px' }}>Scheduled Alerts</h3>
                        <button 
                          onClick={() => setIsAddingTrigger(!isAddingTrigger)}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isAddingTrigger ? '#FF3B30' : 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: isAddingTrigger ? '#fff' : '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s transform' }}
                        >
                          <Plus size={18} style={{ transform: isAddingTrigger ? 'rotate(45deg)' : 'none' }} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isAddingTrigger && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ padding: '24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <TimePickerUnit label="HH" value={triggerH} max={99} onChange={setTriggerH} />
                                <TimePickerUnit label="MM" value={triggerM} max={59} onChange={setTriggerM} />
                                <TimePickerUnit label="SS" value={triggerS} max={59} onChange={setTriggerS} />
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Select Sound</div>
                                    <label style={{ fontSize: '9px', color: '#FF3B30', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Plus size={10} /> Upload File
                                      <input 
                                        type="file" 
                                        accept="audio/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          const formData = new FormData();
                                          formData.append('file', file);
                                          try {
                                            const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                            const data = await res.json();
                                            if (data.success) {
                                              await fetchLocalSounds();
                                              setTriggerSound(`/alerts/${file.name}`);
                                              alert(`Uploaded ${file.name} successfully!`);
                                            } else alert(data.error);
                                          } catch (err) { alert("Upload failed"); }
                                        }}
                                      />
                                    </label>
                                  </div>
                                  <select 
                                    value={triggerSound}
                                    onChange={(e) => setTriggerSound(e.target.value)}
                                    style={{ 
                                      width: '100%', 
                                      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                                      borderRadius: '12px', 
                                      padding: '12px', 
                                      color: '#fff', 
                                      fontSize: '12px',
                                      colorScheme: 'dark' // Fixes the white dropdown list in most browsers
                                    }}
                                  >
                                    <option value="" style={{ background: '#111' }}>Choose Sound...</option>
                                    {localSounds.map((s, i) => (
                                      <option key={i} value={`/alerts/${s}`} style={{ background: '#111' }}>{s}</option>
                                    ))}
                                  </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <input 
                                    type="text" 
                                    value={customSoundUrl}
                                    onChange={(e) => {
                                      setCustomSoundUrl(e.target.value);
                                      if (e.target.value.includes('myinstants.com') && !e.target.value.includes('.mp3')) {
                                        alert("Tip for MyInstants: Right-click 'Download MP3' and 'Copy link address'!");
                                      }
                                    }}
                                    placeholder="OR PASTE URL HTTPS://..."
                                    style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '12px' }}
                                  />
                                  <div style={{ fontSize: '8px', color: '#444', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.5px' }}>
                                    Direct links only. YouTube/Drive NOT supported.
                                  </div>
                                </div>

                                <button 
                                  onClick={handleAddTrigger}
                                  style={{ height: '54px', width: '100%', backgroundColor: '#FF3B30', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '1px' }}
                                >
                                  Add Alert
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Active Alerts</div>
                          <button onClick={fetchLocalSounds} style={{ fontSize: '9px', color: '#FF3B30', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900' }}>REFRESH SOUNDS</button>
                        </div>

                        {props.triggers.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {props.triggers.map((t, i) => (
                              <div key={i} style={{ padding: '16px 20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-orbitron), monospace', color: '#fff' }}>
                                    {formatTime(t.time).hh}:{formatTime(t.time).mm}:{formatTime(t.time).ss}
                                  </div>
                                  <div style={{ fontSize: '9px', color: '#666', wordBreak: 'break-all', maxWidth: '200px' }}>{t.soundUrl.split('/').pop()}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                  <button onClick={() => testSound(t.soundUrl)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FF3B30', cursor: 'pointer', fontWeight: '900', fontSize: '10px' }}>TEST</button>
                                  <button onClick={() => props.removeTrigger(i)} style={{ backgroundColor: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px', color: '#444', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            No Alerts Scheduled
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h3 style={{ fontSize: '10px', fontWeight: '900', color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '3px' }}>Final Finish Alert</h3>
                      <select 
                        value={props.alertSound}
                        onChange={(e) => props.updateAlertSound(e.target.value)}
                        style={{ 
                          width: '100%', 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: '12px', 
                          padding: '12px', 
                          color: '#fff', 
                          fontSize: '12px',
                          colorScheme: 'dark'
                        }}
                      >
                        {localSounds.map((s, i) => (
                          <option key={i} value={`/alerts/${s}`} style={{ background: '#111' }}>{s}</option>
                        ))}
                      </select>
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
