"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type FontSize = "sm" | "base" | "lg" | "xl";

export interface FontSizeOption {
  id: FontSize;
  label: string;
  display: string;
  percentage: string;
  ratio: number;
}

export const FONT_SIZES: FontSizeOption[] = [
  { id: "sm", label: "Small", display: "A-", percentage: "90%", ratio: 0.9 },
  { id: "base", label: "Normal", display: "A", percentage: "100%", ratio: 1.0 },
  { id: "lg", label: "Large", display: "A+", percentage: "115%", ratio: 1.15 },
  { id: "xl", label: "Extra Large", display: "A++", percentage: "130%", ratio: 1.3 },
];

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  currentPercentage: string;
  options: FontSizeOption[];
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const STORAGE_KEY = "jansahayak_font_size";

function applyFontSize(size: FontSize) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-font-size", size);

  switch (size) {
    case "sm":
      root.style.fontSize = "90%";
      break;
    case "base":
      root.style.fontSize = "100%";
      break;
    case "lg":
      root.style.fontSize = "115%";
      break;
    case "xl":
      root.style.fontSize = "130%";
      break;
    default:
      root.style.fontSize = "100%";
  }
}

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("base");

  // Read stored preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as FontSize | null;
      if (saved && ["sm", "base", "lg", "xl"].includes(saved)) {
        setFontSizeState(saved);
        applyFontSize(saved);
      } else {
        applyFontSize("base");
      }
    } catch {
      applyFontSize("base");
    }
  }, []);

  const setFontSize = useCallback((newSize: FontSize) => {
    setFontSizeState(newSize);
    applyFontSize(newSize);
    try {
      localStorage.setItem(STORAGE_KEY, newSize);
    } catch (e) {
      console.error("Failed to save font size", e);
    }
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSizeState((current) => {
      const order: FontSize[] = ["sm", "base", "lg", "xl"];
      const currentIndex = order.indexOf(current);
      const nextIndex = Math.min(order.length - 1, currentIndex + 1);
      const nextSize = order[nextIndex];
      applyFontSize(nextSize);
      try {
        localStorage.setItem(STORAGE_KEY, nextSize);
      } catch {}
      return nextSize;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSizeState((current) => {
      const order: FontSize[] = ["sm", "base", "lg", "xl"];
      const currentIndex = order.indexOf(current);
      const nextIndex = Math.max(0, currentIndex - 1);
      const nextSize = order[nextIndex];
      applyFontSize(nextSize);
      try {
        localStorage.setItem(STORAGE_KEY, nextSize);
      } catch {}
      return nextSize;
    });
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSize("base");
  }, [setFontSize]);

  const currentOption = FONT_SIZES.find((f) => f.id === fontSize) || FONT_SIZES[1];

  return (
    <FontSizeContext.Provider
      value={{
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        currentPercentage: currentOption.percentage,
        options: FONT_SIZES,
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error("useFontSize must be used within a FontSizeProvider");
  }
  return context;
}
