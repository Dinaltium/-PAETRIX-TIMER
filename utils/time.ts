/**
 * Formats seconds into HH:MM:SS components
 */
export function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return {
    h,
    m,
    s,
    hh: String(h).padStart(2, "0"),
    mm: String(m).padStart(2, "0"),
    ss: String(s).padStart(2, "0"),
  };
}

/**
 * Converts HH:MM:SS to total seconds
 */
export function getSecondsFromHHMMSS(h: number, m: number, s: number): number {
  return h * 3600 + m * 60 + s;
}

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  REMAINING_TIME: "hackathon_timer_remaining",
  INITIAL_TIME: "hackathon_timer_initial",
  IS_ACTIVE: "hackathon_timer_active",
  IS_MUTED: "hackathon_timer_muted",
  EVENT_NAME: "hackathon_timer_event_name",
  LAST_ACTIVE_TIME: "hackathon_timer_last_active",
  ALERT_SOUND: "hackathon_timer_alert_sound",
  SCHEDULED_TRIGGERS: "hackathon_timer_scheduled_triggers",
};

/**
 * Persist state to local storage
 */
export function persistState(key: string, value: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * Load state from local storage
 */
export function loadState<T>(key: string, defaultValue: T): T {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved) as T;
      } catch {
        return defaultValue;
      }
    }
  }
  return defaultValue;
}
