"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Recycle, ScanLine, Target } from "lucide-react";
import { useScanStore } from "@/components/scan/scan-store";

function formatPercent(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n)}%`;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(Math.max(0, Math.floor(n)));
}

export function StatsCards() {
  const { scans } = useScanStore();

  const totalScans = scans.length;
  const recyclingScans = scans.filter(s => s.binSuggestion === "recycling").length;
  const recyclingRate = totalScans > 0 ? (recyclingScans / totalScans) * 100 : 0;

  // Approximate "accuracy" as average confidence (until you have ground truth).
  const avgConfidence =
    totalScans > 0
      ? (scans.reduce((acc, s) => acc + (s.binConfidence ?? 0), 0) / totalScans) * 100
      : 0;

  // Placeholder: unique user count isn't tracked locally.
  const activeUsers = 1;

  const stats = [
    {
      title: "Recycling Rate",
      value: formatPercent(recyclingRate),
      description: totalScans > 0 ? `${recyclingScans} of ${totalScans} scans` : "No scans yet",
      icon: Recycle,
    },
    {
      title: "Total Items Scanned",
      value: formatNumber(totalScans),
      description: totalScans > 0 ? "Updates from your scans" : "Scan an item to begin",
      icon: ScanLine,
    },
    {
      title: "Segregation Confidence",
      value: formatPercent(avgConfidence),
      description: "Average model confidence",
      icon: Target,
    },
    {
      title: "Active Users",
      value: formatNumber(activeUsers),
      description: "Local session",
      icon: Users,
    },
  ];

  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
