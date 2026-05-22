"use client";

import { useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

const STORAGE_KEY = "tractionfi:theme";

type Snapshot = { preference: ThemePreference; theme: Theme; mounted: boolean };

const SERVER_SNAPSHOT: Snapshot = {
  preference: "system",
  theme: "dark",
  mounted: false,
};

let clientSnapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* localStorage unavailable */
  }
  return "system";
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function emit() {
  for (const l of listeners) l();
}

function getClientSnapshot(): Snapshot {
  if (clientSnapshot) return clientSnapshot;
  const preference = readPreference();
  const theme: Theme = preference === "system" ? systemTheme() : preference;
  clientSnapshot = { preference, theme, mounted: true };
  return clientSnapshot;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    const s = getClientSnapshot();
    if (s.preference !== "system") return;
    const next: Theme = mq.matches ? "dark" : "light";
    if (next === s.theme) return;
    clientSnapshot = { ...s, theme: next };
    applyTheme(next);
    emit();
  };
  mq.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", onSystemChange);
  };
}

export function setThemePreference(next: ThemePreference) {
  try {
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* localStorage unavailable */
  }
  const theme: Theme = next === "system" ? systemTheme() : next;
  clientSnapshot = { preference: next, theme, mounted: true };
  applyTheme(theme);
  emit();
}

export function useTheme() {
  const snap = useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_SNAPSHOT);
  return {
    theme: snap.theme,
    preference: snap.preference,
    mounted: snap.mounted,
    setPreference: setThemePreference,
  };
}
