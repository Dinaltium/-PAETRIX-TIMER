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
  const [remainingTime, setRemainingTime] = useState<number>(() =>
    loadState(STORAGE_KEYS.REMAINING_TIME, 3600)
  );
  const [isActive, setIsActive] = useState<boolean>(() =>
    loadState(STORAGE_KEYS.IS_ACTIVE, false)
  );
  const [isMuted, setIsMuted] = useState<boolean>(() =>
    loadState(STORAGE_KEYS.IS_MUTED, false)
  );
  const [initialTime, setInitialTime] = useState<number>(() =>
    loadState(STORAGE_KEYS.INITIAL_TIME, 3600)
  );

  const timerRef = useRef<number | null>(null);
  const expectedTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (remainingTime > 0) {
      setIsActive(true);
      persistState(STORAGE_KEYS.IS_ACTIVE, true);
    }
  }, [remainingTime]);

  const pause = useCallback(() => {
    setIsActive(false);
    persistState(STORAGE_KEYS.IS_ACTIVE, false);
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

  const playAlert = useCallback(() => {
    if (!isMuted && typeof window !== "undefined") {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Sound play failed:", e));
    }
  }, [isMuted]);

  useEffect(() => {
    if (!isActive || remainingTime <= 0) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      if (remainingTime === 0 && isActive) {
        playAlert();
      }
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
          persistState(STORAGE_KEYS.REMAINING_TIME, next);
          if (next === 0) {
            setIsActive(false);
            persistState(STORAGE_KEYS.IS_ACTIVE, false);
          }
          return next;
        });
        
        // Schedule next tick based on drift
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
        // Clear timeout if we used it
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, remainingTime]);

  return {
    remainingTime,
    isActive,
    isMuted,
    initialTime,
    start,
    pause,
    reset,
    setTime,
    toggleMute,
  };
}
