"use client";

import React from "react";
import { ScanProvider } from "@/components/scan/scan-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ScanProvider>{children}</ScanProvider>;
}
