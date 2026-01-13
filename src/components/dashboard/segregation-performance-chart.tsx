"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp, TrendingDown } from "lucide-react";

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
          className="mx-auto aspect-square w-full max-w-[300px]"
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
              innerRadius={70}
              strokeWidth={5}
            >
                {chartData.map((entry) => (
                    <Cell key={`cell-${entry.type}`} fill={entry.fill} />
                ))}
            </Pie>
            <Legend content={({ payload }) => {
                return (
                    <ul className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                    {payload?.map((entry, index) => (
                        <li key={`item-${index}`} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.value}</span>
                        <span>({((entry.payload.value / totalValue) * 100).toFixed(1)}%)</span>
                        </li>
                    ))}
                    </ul>
                )
            }} />
          </PieChart>
        </ChartContainer>
      </CardContent>
       <div className="flex-1 flex flex-col items-center justify-center text-center mt-[-2rem] mb-4">
        <p className="text-xs text-muted-foreground">Overall Accuracy</p>
        <p className="text-5xl font-bold">{accuracy}%</p>
      </div>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          Most common error: Plastics in compost
        </div>
      </CardFooter>
    </Card>
  )
}
