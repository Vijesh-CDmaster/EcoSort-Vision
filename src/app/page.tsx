import { SegregationPerformanceChart } from "@/components/dashboard/segregation-performance-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { BinMonitoring } from "@/components/dashboard/bin-monitoring";
import { ContaminationAlerts } from "@/components/dashboard/contamination-alerts";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Dashboard
        </h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <BinMonitoring />
        </div>
        <div className="lg:col-span-2">
          <SegregationPerformanceChart />
        </div>
      </div>
      
      <div>
        <ContaminationAlerts />
      </div>

    </div>
  );
}
