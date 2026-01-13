"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type WasteBin = "recycling" | "compost" | "landfill";

export type ScanDetection = {
  label: string;
  confidence: number;
};

export type ScanRecord = {
  id: string;
  timestamp: number;
  source: "upload" | "camera";
  wasteType: string;
  wasteTypeConfidence: number;
  binSuggestion: WasteBin;
  binConfidence: number;
  imageUrl: string;
  detections?: ScanDetection[];
};

type ScanStore = {
  scans: ScanRecord[];
  addScan: (scan: Omit<ScanRecord, "id" | "timestamp"> & Partial<Pick<ScanRecord, "id" | "timestamp">>) => void;
  clearScans: () => void;
};

const STORAGE_KEY = "ecosort.scans.v1";
const MAX_SCANS = 200;

function safeParseScans(raw: string | null): ScanRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(Boolean)
      .map((s: any) => ({
        id: String(s.id ?? crypto.randomUUID()),
        timestamp: Number(s.timestamp ?? Date.now()),
        source: (s.source === "camera" ? "camera" : "upload") as "camera" | "upload",
        wasteType: String(s.wasteType ?? "unknown"),
        wasteTypeConfidence: Number(s.wasteTypeConfidence ?? 0),
        binSuggestion: (s.binSuggestion ?? "landfill") as WasteBin,
        binConfidence: Number(s.binConfidence ?? 0),
        imageUrl: String(s.imageUrl ?? ""),
        detections: Array.isArray(s.detections)
          ? s.detections.map((d: any) => ({ label: String(d.label), confidence: Number(d.confidence ?? 0) }))
          : undefined,
      }))
      .slice(0, MAX_SCANS);
  } catch {
    return [];
  }
}

function loadInitialScans(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  return safeParseScans(window.localStorage.getItem(STORAGE_KEY));
}

const ScanContext = createContext<ScanStore | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  // Hydration-safe: start empty so server/client first render match.
  const [scans, setScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    setScans(loadInitialScans());
  }, []);

  useEffect(() => {
    // Keep store in sync across tabs.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setScans(safeParseScans(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: ScanRecord[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setScans(next);
  }, []);

  const addScan: ScanStore["addScan"] = useCallback((scan) => {
    const record: ScanRecord = {
      id: scan.id ?? crypto.randomUUID(),
      timestamp: scan.timestamp ?? Date.now(),
      source: scan.source ?? "upload",
      wasteType: scan.wasteType,
      wasteTypeConfidence: scan.wasteTypeConfidence,
      binSuggestion: scan.binSuggestion,
      binConfidence: scan.binConfidence,
      imageUrl: scan.imageUrl,
      detections: scan.detections,
    };

    setScans((prev) => {
      const next = [record, ...prev].slice(0, MAX_SCANS);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearScans = useCallback(() => {
    persist([]);
  }, [persist]);

  const value = useMemo(() => ({ scans, addScan, clearScans }), [scans, addScan, clearScans]);

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScanStore(): ScanStore {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScanStore must be used within ScanProvider");
  return ctx;
}
