"use client";

import * as React from "react";
import Image from "next/image";
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
import { ArrowUpDown, AlertTriangle, Bell, MoreHorizontal, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";

type Alert = {
  id: string;
  type: "Contamination" | "Bin Full";
  description: string;
  severity: "high" | "medium" | "low";
  timestamp: number;
  bin: "Recycling" | "Compost" | "Landfill";
  contaminant: string;
  status: "new" | "acknowledged";
  imageUrl: string;
};

const alertData: Alert[] = [
  {
    id: "alert-001",
    type: "Contamination",
    description: "A plastic bag was found in the paper recycling stream.",
    severity: "high",
    timestamp: 1666888320000,
    bin: "Recycling",
    contaminant: "Plastic Bag",
    status: "new",
    imageUrl: PlaceHolderImages.find(p => p.id === 'scanner-placeholder')?.imageUrl || '',
  },
  {
    id: "alert-002",
    type: "Bin Full",
    description: "The main landfill bin is now at 95% capacity.",
    severity: "medium",
    timestamp: 1666887240000,
    bin: "Landfill",
    contaminant: "N/A",
    status: "new",
    imageUrl: '',
  },
  {
    id: "alert-003",
    type: "Contamination",
    description: "A glass bottle was identified in the compost bin.",
    severity: "high",
    timestamp: 1666884900000,
    bin: "Compost",
    contaminant: "Glass Bottle",
    status: "acknowledged",
    imageUrl: PlaceHolderImages.find(p => p.id === 'scanner-placeholder')?.imageUrl || '',
  },
];

const SeverityBadge = ({ severity }: { severity: Alert["severity"] }) => {
  const variant = {
    high: "destructive",
    medium: "secondary",
    low: "outline",
  }[severity] as "destructive" | "secondary" | "outline";
  
  return <Badge variant={variant}>{severity}</Badge>;
};

const ContaminationDetailsDialog = ({ alert }: { alert: Alert }) => {
    const [formattedDate, setFormattedDate] = React.useState('');

    React.useEffect(() => {
        setFormattedDate(new Date(alert.timestamp).toLocaleString());
    }, [alert.timestamp]);

    return (
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Alert Details: {alert.id}</AlertDialogTitle>
            <AlertDialogDescription>
            Detailed information about the contamination event.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden">
            {alert.imageUrl ? (
                <Image
                    src={alert.imageUrl}
                    alt={`Contamination image for ${alert.id}`}
                    fill
                    objectFit="cover"
                />
            ) : <div className="bg-muted h-full w-full flex items-center justify-center"><p className="text-muted-foreground">No image</p></div> }
            </div>
            <div>
            <p><strong>Bin:</strong> {alert.bin}</p>
            <p><strong>Contaminant:</strong> {alert.contaminant}</p>
            <p><strong>Time:</strong> {formattedDate}</p>
            <p><strong>Severity:</strong> <span className="capitalize">{alert.severity}</span></p>
            </div>
        </div>
        <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
        </AlertDialogContent>
    );
};

const FormattedDate = ({ timestamp }: { timestamp: number }) => {
    const [formattedDate, setFormattedDate] = React.useState('');
  
    React.useEffect(() => {
      setFormattedDate(new Date(timestamp).toLocaleString());
    }, [timestamp]);
  
    return <div>{formattedDate}</div>;
};

export function ContaminationAlerts() {
  const [data, setData] = React.useState(alertData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const acknowledgeAlert = (id: string) => {
    setData(currentData => 
        currentData.map(alert => 
            alert.id === id ? { ...alert, status: "acknowledged" } : alert
        )
    );
  };
  
  const columns: ColumnDef<Alert>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
            {row.original.severity === 'high' ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Bell className="h-4 w-4 text-yellow-500" />}
            <span className="capitalize">{row.getValue("type")}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue("description")}</div>,
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Timestamp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <FormattedDate timestamp={row.getValue("timestamp")} />,
    },
    {
        accessorKey: "bin",
        header: "Bin",
    },
    {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => <SeverityBadge severity={row.getValue("severity")} />,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={row.getValue("status") === 'new' ? 'outline' : 'default'}>{row.getValue("status")}</Badge>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const alert = row.original;
        return (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4"/>
                        View Details
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <DropdownMenuItem
                    disabled={alert.status === 'acknowledged'}
                    onClick={() => acknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ContaminationDetailsDialog alert={alert} />
          </AlertDialog>
        );
      },
    },
  ];


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
    initialState: {
        pagination: {
            pageSize: 5,
        },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
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
                placeholder="Filter alerts by description..."
                value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                    table.getColumn("description")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
                />
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
      </CardContent>
    </Card>
  );
}
