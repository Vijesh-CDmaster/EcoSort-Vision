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
import { ArrowUpDown, AlertTriangle, Bell, MoreHorizontal, CheckCircle } from "lucide-react";

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

const data: Alert[] = [
  {
    id: "alert-1",
    type: "Contamination",
    description: "A plastic bag was found in the paper recycling stream.",
    timestamp: "2023-10-27T10:32:00Z",
    status: "unresolved",
    severity: "high",
  },
  {
    id: "alert-2",
    type: "Bin Full",
    description: "The main landfill bin is now at 95% capacity.",
    timestamp: "2023-10-27T09:15:00Z",
    status: "unresolved",
    severity: "medium",
  },
  {
    id: "alert-3",
    type: "Contamination",
    description: "A glass bottle was identified in the compost bin.",
    timestamp: "2023-10-26T14:00:00Z",
    status: "resolved",
    severity: "high",
  },
   {
    id: "alert-4",
    type: "System",
    description: "Scanner camera on Bin #2 is offline.",
    timestamp: "2023-10-26T11:00:00Z",
    status: "unresolved",
    severity: "critical",
  },
   {
    id: "alert-5",
    type: "Contamination",
    description: "Food waste detected in recycling bin.",
    timestamp: "2023-10-25T18:45:00Z",
    status: "resolved",
    severity: "medium",
  },
];

export type Alert = {
  id: string;
  type: "Contamination" | "Bin Full" | "System";
  description: string;
  timestamp: string;
  status: "resolved" | "unresolved";
  severity: "low" | "medium" | "high" | "critical";
};

const severityVariant: Record<Alert["severity"], "default" | "secondary" | "destructive"> = {
    low: "default",
    medium: "secondary",
    high: "destructive",
    critical: "destructive",
}

const FormattedDate = ({ timestamp }: { timestamp: string }) => {
  const [formattedDate, setFormattedDate] = React.useState('');

  React.useEffect(() => {
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  return <div>{formattedDate}</div>;
};

export const columns: ColumnDef<Alert>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const Icon = row.original.type === "Contamination" ? AlertTriangle : Bell;
      return <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground"/>
        <span>{row.getValue("type")}</span>
      </div>
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div className="capitalize">{row.getValue("description")}</div>,
  },
   {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => <Badge variant={severityVariant[row.original.severity]}>{row.getValue("severity")}</Badge>,
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Timestamp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <FormattedDate timestamp={row.getValue("timestamp")} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const alert = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(alert.id)}
            >
              Copy Alert ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            {alert.status === 'unresolved' && <DropdownMenuItem>Mark as resolved</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function ContaminationAlerts() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contamination Alerts</CardTitle>
        <CardDescription>Review and manage all system alerts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter by description..."
              value={
                (table.getColumn("description")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("description")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} row(s).
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
