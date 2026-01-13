import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

const binData = [
  {
    name: "Recycling",
    level: 78,
    icon: Icons.Recycling,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    progressColor: "bg-blue-500",
    composition: [
      { type: "Paper", value: 45 },
      { type: "Plastic", value: 35 },
      { type: "Glass", value: 15 },
      { type: "Metal", value: 5 },
    ],
  },
  {
    name: "Compost",
    level: 45,
    icon: Icons.Compost,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    progressColor: "bg-green-500",
    composition: [
      { type: "Food Scraps", value: 80 },
      { type: "Yard Waste", value: 15 },
      { type: "Paper (Soiled)", value: 5 },
    ],
  },
  {
    name: "Landfill",
    level: 62,
    icon: Icons.Landfill,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    progressColor: "bg-gray-500",
    composition: [
      { type: "Non-recyclable Plastic", value: 50 },
      { type: "Styrofoam", value: 20 },
      { type: "Contaminated Items", value: 20 },
      { type: "Other", value: 10 },
    ],
  },
];

export function BinMonitoring() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bin Monitoring</CardTitle>
        <CardDescription>Real-time waste bin fullness and composition.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
        {binData.map((bin) => (
          <div key={bin.name} className={`p-4 rounded-lg flex flex-col ${bin.bgColor}`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${bin.bgColor}`}>
                <bin.icon className={`w-8 h-8 ${bin.color}`} />
              </div>
              <div>
                <span className="text-lg font-bold">{bin.name}</span>
                <p className="text-sm text-muted-foreground">Fullness Level</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
                <span className="text-4xl font-bold">{bin.level}%</span>
                <span className="text-sm text-muted-foreground">/ 100%</span>
            </div>
            <Progress value={bin.level} aria-label={`${bin.name} bin fullness`} className="mt-2 h-2" indicatorClassName={bin.progressColor} />
            
            <Separator className="my-4 bg-gray-500/20" />

            <div>
              <h4 className="text-sm font-semibold mb-2">Composition</h4>
              <ul className="space-y-2 text-sm">
                {bin.composition.map(item => (
                  <li key={item.type} className="flex justify-between items-center">
                    <span>{item.type}</span>
                    <span className="font-medium">{item.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
