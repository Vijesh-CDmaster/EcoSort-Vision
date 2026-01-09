"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { type: "Correct", value: 489, fill: "hsl(var(--chart-1))" },
  { type: "Incorrect", value: 45, fill: "hsl(var(--chart-2))" },
]

const chartConfig = {
    value: {
        label: "Items",
    },
    Correct: {
        label: "Correct",
        color: "hsl(var(--chart-1))",
    },
    Incorrect: {
        label: "Incorrect",
        color: "hsl(var(--chart-2))",
    },
}

export function SegregationPerformanceChart() {
  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [])
  
  const accuracy = totalValue > 0 ? ((chartData[0].value / totalValue) * 100).toFixed(1) : "0.0";

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Segregation Performance</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <PieChart>
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
            >
                {chartData.map((entry) => (
                    <Cell key={`cell-${entry.type}`} fill={entry.fill} />
                ))}
            </Pie>
            
          </PieChart>
        </ChartContainer>
      </CardContent>
       <div className="flex-1 flex flex-col items-center justify-center text-center mt-[-2rem] mb-4">
        <p className="text-xs text-muted-foreground">Accuracy</p>
        <p className="text-4xl font-bold">{accuracy}%</p>
      </div>
    </Card>
  )
}
