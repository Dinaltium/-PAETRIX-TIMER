"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { persistState, loadState, STORAGE_KEYS } from "@/utils/time";

export interface CountdownState {
  remainingTime: number;
  isActive: boolean;
  isMuted: boolean;
  initialTime: number;
}

export function useCountdown() {
  const [initialTime, setInitialTime] = useState<number>(3600);
  const [remainingTime, setRemainingTime] = useState<number>(3600);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [alertSound, setAlertSound] = useState<string>("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  const [triggers, setTriggers] = useState<{time: number, soundUrl: string}[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize state from localStorage after mount
  useEffect(() => {
    const savedInitial = loadState(STORAGE_KEYS.INITIAL_TIME, 3600);
    const savedRemaining = loadState(STORAGE_KEYS.REMAINING_TIME, 3600);
    const savedMuted = loadState(STORAGE_KEYS.IS_MUTED, false);
    const savedActive = loadState(STORAGE_KEYS.IS_ACTIVE, false);
    const lastActive = loadState(STORAGE_KEYS.LAST_ACTIVE_TIME, Date.now());
    const savedSound = loadState(STORAGE_KEYS.ALERT_SOUND, "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    const savedTriggers = loadState(STORAGE_KEYS.SCHEDULED_TRIGGERS, []);

    let finalRemaining = savedRemaining;
    if (savedActive) {
      const diff = Math.floor((Date.now() - lastActive) / 1000);
      finalRemaining = Math.max(0, savedRemaining - diff);
      setIsActive(true);
    }
    
    setInitialTime(savedInitial);
    setRemainingTime(finalRemaining);
    setIsMuted(savedMuted);
    setAlertSound(savedSound);
    setTriggers(savedTriggers);
    setIsMounted(true);
  }, []);

  const timerRef = useRef<number | null>(null);
  const expectedTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (remainingTime > 0) {
      setIsActive(true);
      persistState(STORAGE_KEYS.IS_ACTIVE, true);
      persistState(STORAGE_KEYS.LAST_ACTIVE_TIME, Date.now());
    }
  }, [remainingTime]);

  const pause = useCallback(() => {
    setIsActive(false);
    persistState(STORAGE_KEYS.IS_ACTIVE, false);
    persistState(STORAGE_KEYS.LAST_ACTIVE_TIME, Date.now());
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    expectedTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    pause();
    setRemainingTime(initialTime);
    persistState(STORAGE_KEYS.REMAINING_TIME, initialTime);
  }, [initialTime, pause]);

  const setTime = useCallback((seconds: number) => {
    setRemainingTime(seconds);
    setInitialTime(seconds);
    persistState(STORAGE_KEYS.REMAINING_TIME, seconds);
    persistState(STORAGE_KEYS.INITIAL_TIME, seconds);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newState = !prev;
      persistState(STORAGE_KEYS.IS_MUTED, newState);
      return newState;
    });
  }, []);

  const updateAlertSound = useCallback((url: string) => {
    setAlertSound(url);
    persistState(STORAGE_KEYS.ALERT_SOUND, url);
  }, []);

  const addTrigger = useCallback((time: number, soundUrl: string) => {
    setTriggers((prev) => {
      const next = [...prev, { time, soundUrl }].sort((a, b) => b.time - a.time);
      persistState(STORAGE_KEYS.SCHEDULED_TRIGGERS, next);
      return next;
    });
  }, []);

  const removeTrigger = useCallback((index: number) => {
    setTriggers((prev) => {
      const next = prev.filter((_, i) => i !== index);
      persistState(STORAGE_KEYS.SCHEDULED_TRIGGERS, next);
      return next;
    });
  }, []);

  const playSound = useCallback((url: string) => {
    if (!isMuted && typeof window !== "undefined") {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Sound play failed:", e));
    }
  }, [isMuted]);

  const lastPlayedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || remainingTime <= 0) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      return;
    }

    const tick = () => {
      const now = performance.now();
      
      if (expectedTimeRef.current === null) {
        expectedTimeRef.current = now + 1000;
      }

      const drift = now - expectedTimeRef.current;

      if (drift >= 0) {
        setRemainingTime((prev) => {
          const next = Math.max(0, prev - 1);
          
          // Check for scheduled triggers
          const activeTrigger = triggers.find(t => t.time === next);
          if (activeTrigger) {
            playSound(activeTrigger.soundUrl);
          }

          // Check for finish
          if (next === 0 && lastPlayedRef.current !== 0) {
            playSound(alertSound);
            lastPlayedRef.current = 0;
            setIsActive(false);
            persistState(STORAGE_KEYS.IS_ACTIVE, false);
          }

          persistState(STORAGE_KEYS.REMAINING_TIME, next);
          persistState(STORAGE_KEYS.LAST_ACTIVE_TIME, Date.now());
          return next;
        });
        
        expectedTimeRef.current += 1000;
        const nextInterval = Math.max(0, 1000 - drift);
        timerRef.current = window.setTimeout(() => {
          timerRef.current = requestAnimationFrame(tick);
        }, nextInterval) as unknown as number;
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, remainingTime, playSound, alertSound, triggers]);

  if (!isMounted) return {
    initialTime: 3600,
    remainingTime: 3600,
    isActive: false,
    isMuted: false,
    alertSound: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    triggers: [],
    start: () => {},
    pause: () => {},
    reset: () => {},
    setTime: () => {},
    toggleMute: () => {},
    updateAlertSound: () => {},
    addTrigger: () => {},
    removeTrigger: () => {},
  };

  return {
    remainingTime,
    isActive,
    isMuted,
    initialTime,
    alertSound,
    triggers,
    start,
    pause,
    reset,
    setTime,
    toggleMute,
    updateAlertSound,
    addTrigger,
    removeTrigger,
  };
}
