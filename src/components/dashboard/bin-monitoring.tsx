import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/icons";

const binData = [
  {
    name: "Recycling",
    level: 78,
    icon: Icons.Recycling,
    color: "text-blue-500",
    progressColor: "bg-blue-500",
  },
  {
    name: "Compost",
    level: 45,
    icon: Icons.Compost,
    color: "text-green-500",
    progressColor: "bg-green-500",
  },
  {
    name: "Landfill",
    level: 62,
    icon: Icons.Landfill,
    color: "text-gray-500",
    progressColor: "bg-gray-500",
  },
];

export function BinMonitoring() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bin Monitoring</CardTitle>
        <CardDescription>Real-time waste bin fullness levels.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {binData.map((bin) => (
          <div key={bin.name}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <bin.icon className={`w-5 h-5 ${bin.color}`} />
                <span className="font-medium">{bin.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{bin.level}% Full</span>
            </div>
            <Progress value={bin.level} aria-label={`${bin.name} bin fullness`} indicatorClassName={bin.progressColor} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
