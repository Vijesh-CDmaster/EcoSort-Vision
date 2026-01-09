import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Bell } from "lucide-react";

const alerts = [
  {
    title: "Contamination Detected in Recycling Bin",
    description: "A plastic bag was found in the paper recycling stream at 10:32 AM.",
    variant: "destructive",
    icon: AlertTriangle,
  },
  {
    title: "Bin #3 Full",
    description: "The main landfill bin is now at 95% capacity.",
    variant: "default",
    icon: Bell,
  },
  {
    title: "Contamination Detected in Compost",
    description: "A glass bottle was identified in the compost bin at 9:15 AM.",
    variant: "destructive",
    icon: AlertTriangle,
  },
];

export function ContaminationAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contamination Alerts</CardTitle>
        <CardDescription>Recent alerts and notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alertItem, index) => (
          <Alert key={index} variant={alertItem.variant as "default" | "destructive"}>
            <alertItem.icon className="h-4 w-4" />
            <AlertTitle>{alertItem.title}</AlertTitle>
            <AlertDescription>{alertItem.description}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
