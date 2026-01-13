
"use client";

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


const binData = [
  {
    name: "Recycling",
    level: 78,
    icon: Icons.Recycling,
    color: "text-blue-500",
    progressColor: "bg-blue-500",
    composition: [
      { name: "Paper", percentage: 50, confidence: 0.95 },
      { name: "Plastics", percentage: 30, confidence: 0.88 },
      { name: "Glass", percentage: 15, confidence: 0.98 },
      { name: "Other", percentage: 5, confidence: 0.70 },
    ],
    harmfulItems: ["Broken Glass"],
  },
  {
    name: "Compost",
    level: 45,
    icon: Icons.Compost,
    color: "text-green-500",
    progressColor: "bg-green-500",
    composition: [
      { name: "Food Scraps", percentage: 80, confidence: 0.99 },
      { name: "Yard Waste", percentage: 15, confidence: 0.92 },
      { name: "Other", percentage: 5, confidence: 0.65 },
    ],
    harmfulItems: [],
  },
  {
    name: "Landfill",
    level: 62,
    icon: Icons.Landfill,
    color: "text-gray-500",
    progressColor: "bg-gray-500",
    composition: [
      { name: "Non-recyclable plastics", percentage: 40, confidence: 0.91 },
      { name: "Styrofoam", percentage: 30, confidence: 0.94 },
      { name: "Other", percentage: 30, confidence: 0.75 },
    ],
    harmfulItems: ["Batteries", "Electronics"],
  },
];

const WasteComposition = ({ composition }: { composition: { name: string, percentage: number, confidence: number }[] }) => (
    <div className="space-y-2 mt-4">
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bin Monitoring</CardTitle>
        <CardDescription>Real-time waste bin status and composition.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="item-0">
          {binData.map((bin, index) => (
            <AccordionItem key={bin.name} value={`item-${index}`}>
              <AccordionTrigger>
                 <div className="flex items-center gap-4 w-full">
                    <bin.icon className={`w-6 h-6 ${bin.color}`} />
                    <div className="flex-1 text-left">
                        <span className="font-semibold">{bin.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Progress value={bin.level} aria-label={`${bin.name} bin fullness`} className="h-2" indicatorClassName={bin.progressColor} />
                            <span className="text-xs text-muted-foreground w-16 text-right">{bin.level}% Full</span>
                        </div>
                    </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2">
                 <div className="space-y-4">
                    <WasteComposition composition={bin.composition} />

                    {bin.harmfulItems.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Harmful Items Detected!</AlertTitle>
                            <AlertDescription>
                                The following items require special handling: {bin.harmfulItems.join(", ")}.
                            </AlertDescription>
                        </Alert>
                    )}
                 </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
