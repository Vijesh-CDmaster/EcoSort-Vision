"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, AlertTriangle, Bell, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const alertData = [
    {
      type: "Contamination",
      description: "A plastic bag was found in the paper recycling stream at 10:32 AM.",
      severity: "high",
    },
    {
      type: "Bin Full",
      description: "The main landfill bin is now at 95% capacity.",
      severity: "medium",
    },
    {
      type: "Contamination",
      description: "A glass bottle was identified in the compost bin at 9:15 AM.",
      severity: "high",
    }
]

export function ContaminationAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contamination Alerts</CardTitle>
        <CardDescription>Recent alerts and notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertData.map((alert, index) => (
          <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
            {alert.severity === 'high' ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            <AlertTitle>
              {alert.type === 'Contamination' 
                ? `Contamination Detected in ${alert.description.includes('Recycling') ? 'Recycling Bin' : 'Compost'}` 
                : 'Bin #3 Full'
              }
            </AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
