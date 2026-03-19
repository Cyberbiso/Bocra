"use client";

import { useState, useEffect } from "react";
import { Accessibility, Type, SunMoon, Minus, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FontSize = "sm" | "base" | "lg";

const FONT_CLASSES: Record<FontSize, string> = {
  sm: "text-sm-a11y",
  base: "",
  lg: "text-lg-a11y",
};

export default function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("base");
  const [highContrast, setHighContrast] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedSize = localStorage.getItem("a11y-font") as FontSize | null;
    const savedContrast = localStorage.getItem("a11y-contrast") === "1";
    if (savedSize) setFontSize(savedSize);
    if (savedContrast) setHighContrast(true);
  }, []);

  // Apply font size class to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("text-sm-a11y", "text-lg-a11y");
    if (FONT_CLASSES[fontSize]) html.classList.add(FONT_CLASSES[fontSize]);
    localStorage.setItem("a11y-font", fontSize);
  }, [fontSize]);

  // Apply high-contrast class to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("a11y-contrast", highContrast ? "1" : "0");
  }, [highContrast]);

  function shrink() {
    setFontSize((f) => (f === "lg" ? "base" : f === "base" ? "sm" : "sm"));
  }
  function grow() {
    setFontSize((f) => (f === "sm" ? "base" : f === "base" ? "lg" : "lg"));
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Panel — positioned above the button via absolute, anchored bottom-right */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-14 right-0 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 w-64"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-[#06193e] uppercase tracking-widest">
                Accessibility
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close accessibility panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Text size */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Type className="w-3 h-3" /> Text Size
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={shrink}
                  disabled={fontSize === "sm"}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease text size"
                >
                  <Minus className="w-3 h-3" /> Smaller
                </button>
                <span className="text-xs font-black text-[#06193e] w-10 text-center">
                  {fontSize === "sm" ? "A-" : fontSize === "base" ? "A" : "A+"}
                </span>
                <button
                  onClick={grow}
                  disabled={fontSize === "lg"}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase text size"
                >
                  <Plus className="w-3 h-3" /> Larger
                </button>
              </div>
            </div>

            {/* Contrast toggle */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <SunMoon className="w-3 h-3" /> Contrast
              </p>
              <button
                onClick={() => setHighContrast((v) => !v)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  highContrast
                    ? "bg-[#06193e] text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                aria-pressed={highContrast}
              >
                {highContrast ? "High Contrast: ON" : "High Contrast: OFF"}
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={() => { setFontSize("base"); setHighContrast(false); }}
              className="w-full mt-3 py-1.5 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Reset to defaults
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button — always rendered, never overlapping the panel */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 bg-[#06193e] hover:bg-[#027ac6] text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors"
        aria-label="Accessibility options"
        aria-expanded={open}
      >
        <Accessibility className="w-5 h-5" />
      </button>
    </div>
  );
}
