'use client';

import { useState } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import type { Room, User, RoomStatus, Recording } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, Search, Video } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RoomActions } from './room-actions';

type RoomWithDetails = Room & {
  agent: User;
  recordings: Recording[];
};

interface RoomsTableProps {
  data: RoomWithDetails[];
}

export const RoomsTable = ({ data }: RoomsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<RoomWithDetails>[] = [
    {
      accessorKey: 'customerName',
      header: 'Customer Name',
      cell: ({ row }) => <div>{row.getValue('customerName')}</div>,
    },
    {
      accessorKey: 'applicationId',
      header: 'Application ID',
      cell: ({ row }) => <div>{row.getValue('applicationId')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as RoomStatus;
        const room = row.original;
        
        const statusConfig = {
          PENDING: { label: 'Pending', variant: 'outline' as const },
          ACTIVE: { label: 'Active', variant: 'default' as const },
          COMPLETED: { label: 'Completed', variant: 'secondary' as const },
          REJECTED: { label: 'Rejected', variant: 'destructive' as const },
        };
        
        const { label, variant } = statusConfig[status];
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={variant}>{label}</Badge>
            {room.isCustomerOnline && status !== 'COMPLETED' && status !== 'REJECTED' && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Customer Online</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return <div title={date.toLocaleString()}>{formatDistanceToNow(date, { addSuffix: true })}</div>;
      },
    },
    {
      id: 'recordings',
      header: 'Recordings',
      cell: ({ row }) => {
        const recordings = row.original.recordings || [];
        if (recordings.length === 0) return <div>-</div>;
        return (
          <div className="flex items-center">
            <Video className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{recordings.length}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const room = row.original;
        return <RoomActions room={room} />;
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by customer name..."
          value={(table.getColumn('customerName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('customerName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Status <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => table.getColumn('status')?.setFilterValue('')}
            >
              All
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => table.getColumn('status')?.setFilterValue('PENDING')}
            >
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => table.getColumn('status')?.setFilterValue('ACTIVE')}
            >
              Active
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => table.getColumn('status')?.setFilterValue('COMPLETED')}
            >
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => table.getColumn('status')?.setFilterValue('REJECTED')}
            >
              Rejected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No sessions found.
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
  );
};