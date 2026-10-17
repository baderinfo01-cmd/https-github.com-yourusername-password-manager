"use client";

import { useEffect } from "react";
import { applyStoredMode } from "./ModeToggle";

export default function ThemeInit() {
  useEffect(applyStoredMode, []);
  return null;
}
