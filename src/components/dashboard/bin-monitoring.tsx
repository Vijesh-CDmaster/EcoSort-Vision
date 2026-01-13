
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/icons";
import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useScanStore, type WasteBin } from "@/components/scan/scan-store";

const binMeta = {
  recycling: {
    name: "Recycling",
    icon: Icons.Recycling,
    color: "text-blue-500",
    progressColor: "bg-blue-500",
  },
  compost: {
    name: "Compost",
    icon: Icons.Compost,
    color: "text-green-500",
    progressColor: "bg-green-500",
  },
  landfill: {
    name: "Landfill",
    icon: Icons.Landfill,
    color: "text-gray-500",
    progressColor: "bg-gray-500",
  },
} satisfies Record<WasteBin, any>;

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function computeBinLevel(scansCount: number) {
  // Simple demo heuristic: each scan adds ~5% until full.
  return clampPercent(scansCount * 5);
}

function titleCase(s: string) {
  return s
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const WasteComposition = ({ composition }: { composition: { name: string, percentage: number, confidence: number }[] }) => (
    <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Waste Composition</h4>
        <ul className="space-y-1 text-sm">
            {composition.map(item => (
                <li key={item.name} className="flex justify-between items-center">
                    <span>{item.name}</span>
                    <div className="text-right">
                      <div>{item.percentage}%</div>
                      <div className="text-xs text-muted-foreground">Conf: {(item.confidence * 100).toFixed(0)}%</div>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);


export function BinMonitoring() {
  const { scans } = useScanStore();

  const byBin = React.useMemo(() => {
    const groups: Record<WasteBin, typeof scans> = { recycling: [], compost: [], landfill: [] };
    for (const s of scans) groups[s.binSuggestion]?.push(s);
    return groups;
  }, [scans]);

  const binData = React.useMemo(() => {
    const bins: Array<{
      key: WasteBin;
      name: string;
      level: number;
      icon: any;
      color: string;
      progressColor: string;
      composition: { name: string; percentage: number; confidence: number }[];
      harmfulItems: string[];
    }> = [];

    (Object.keys(binMeta) as WasteBin[]).forEach((binKey) => {
      const binScans = byBin[binKey] ?? [];
      const level = computeBinLevel(binScans.length);

      // Build composition from recent detections.
      const counts = new Map<string, { count: number; confSum: number }>();
      for (const s of binScans.slice(0, 50)) {
        const label = titleCase(s.wasteType || "unknown");
        const prev = counts.get(label) ?? { count: 0, confSum: 0 };
        counts.set(label, { count: prev.count + 1, confSum: prev.confSum + (s.wasteTypeConfidence ?? 0) });
      }

      const total = Array.from(counts.values()).reduce((a, v) => a + v.count, 0);
      const composition = Array.from(counts.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4)
        .map(([name, v]) => ({
          name,
          percentage: total > 0 ? Math.round((v.count / total) * 100) : 0,
          confidence: v.count > 0 ? v.confSum / v.count : 0,
        }));

      // Demo rule: flag low-confidence scans as "harmful" requiring review.
      const harmfulItems = binScans
        .filter(s => (s.binConfidence ?? 0) < 0.35)
        .slice(0, 3)
        .map(s => titleCase(s.wasteType || "unknown"));

      bins.push({
        key: binKey,
        name: binMeta[binKey].name,
        level,
        icon: binMeta[binKey].icon,
        color: binMeta[binKey].color,
        progressColor: binMeta[binKey].progressColor,
        composition: composition.length > 0 ? composition : [{ name: "No data yet", percentage: 0, confidence: 0 }],
        harmfulItems,
      });
    });

    return bins;
  }, [byBin]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bin Monitoring</CardTitle>
        <CardDescription>Real-time waste bin status and composition.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Recycling" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {binData.map((bin) => (
              <TabsTrigger key={bin.name} value={bin.name}>
                <bin.icon className={cn("mr-2 h-4 w-4", bin.color)} />
                {bin.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {binData.map((bin) => (
            <TabsContent key={bin.name} value={bin.name}>
              <Card className="mt-4">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 w-full mb-4">
                        <bin.icon className={`w-10 h-10 ${bin.color}`} />
                        <div className="flex-1 text-left">
                            <span className="text-xl font-bold">{bin.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Progress value={bin.level} aria-label={`${bin.name} bin fullness`} className="h-3" indicatorClassName={bin.progressColor} />
                                <span className="text-sm font-semibold w-16 text-right">{bin.level}% Full</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        <div>
                           <WasteComposition composition={bin.composition} />
                        </div>
                        <div>
                          {bin.harmfulItems.length > 0 ? (
                              <Alert variant="destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>Harmful Items Detected!</AlertTitle>
                                  <AlertDescription>
                                      The following items require special handling: {bin.harmfulItems.join(", ")}.
                                  </AlertDescription>
                              </Alert>
                          ) : (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>No Harmful Items</AlertTitle>
                                <AlertDescription>
                                    No harmful items have been detected in this bin.
                                </AlertDescription>
                            </Alert>
                          )}
                        </div>
                     </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
