import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Recycle, ScanLine, Target } from "lucide-react";

const stats = [
  {
    title: "Recycling Rate",
    value: "68%",
    description: "+5% from last month",
    icon: Recycle,
  },
  {
    title: "Total Items Scanned",
    value: "1,204",
    description: "+80 from last week",
    icon: ScanLine,
  },
  {
    title: "Segregation Accuracy",
    value: "92.1%",
    description: "Aiming for 95%",
    icon: Target,
  },
  {
    title: "Active Users",
    value: "316",
    description: "+2 from yesterday",
    icon: Users,
  },
];

export function StatsCards() {
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
