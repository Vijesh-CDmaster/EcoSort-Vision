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
    bgColor: "bg-blue-500/10",
    progressColor: "bg-blue-500"
  },
  {
    name: "Compost",
    level: 45,
    icon: Icons.Compost,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    progressColor: "bg-green-500"
  },
  {
    name: "Landfill",
    level: 62,
    icon: Icons.Landfill,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    progressColor: "bg-gray-500"
  },
];

export function BinMonitoring() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bin Monitoring</CardTitle>
        <CardDescription>Real-time waste bin fullness levels.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-3">
        {binData.map((bin) => (
          <div key={bin.name} className={`p-4 rounded-lg flex flex-col items-center justify-center text-center ${bin.bgColor}`}>
            <bin.icon className={`w-10 h-10 ${bin.color}`} />
            <span className="text-lg font-bold mt-4">{bin.name}</span>
            <span className="text-2xl font-bold">{bin.level}%</span>
            <Progress value={bin.level} aria-label={`${bin.name} bin fullness`} className="mt-2 h-2" indicatorClassName={bin.progressColor} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
