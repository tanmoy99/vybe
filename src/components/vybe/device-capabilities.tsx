"use client";

import { useEffect } from "react";

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/**
 * Flags low-powered devices so ambient effects (orbits, blur) switch off.
 * Reduced motion is handled separately in CSS via prefers-reduced-motion.
 */
export function DeviceCapabilities() {
  useEffect(() => {
    const nav = navigator as NavigatorHints;
    const lowPower =
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) ||
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
      nav.connection?.saveData === true;
    if (lowPower) document.documentElement.dataset.lowPower = "";
  }, []);
  return null;
}
