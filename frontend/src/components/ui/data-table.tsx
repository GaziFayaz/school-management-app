'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from 'lucide-react';

export interface ColumnDef<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

export interface FilterTabOption {
  label: string;
  value: string;
  count?: number;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchKey?: keyof T | string;
  searchPlaceholder?: string;
  filterOptions?: FilterTabOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  pageSize?: number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  filterOptions,
  filterValue,
  onFilterChange,
  isLoading = false,
  emptyMessage = 'No records found.',
  emptyAction,
  pageSize = 10,
  className = '',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle sorting toggle
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim() && searchKey) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const val = item[searchKey as string];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchTerm, searchKey, sortKey, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls Bar: Search & Status Filter Tabs */}
      {(searchKey || filterOptions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchKey ? (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>
          ) : <div />}

          {filterOptions && onFilterChange && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {filterOptions.map((opt) => {
                const isActive = filterValue === opt.value;
                return (
                  <Button
                    key={opt.value}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      onFilterChange(opt.value);
                      setCurrentPage(1);
                    }}
                    className="h-8 text-xs font-medium px-3 whitespace-nowrap"
                  >
                    {opt.label}
                    {typeof opt.count === 'number' && (
                      <Badge
                        variant={isActive ? 'secondary' : 'outline'}
                        className="ml-1.5 text-[10px] px-1.5 py-0 h-4"
                      >
                        {opt.count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={`text-xs font-semibold text-foreground h-10 ${col.headerClassName || ''}`}
                >
                  {col.sortable && col.accessorKey ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.accessorKey as string)}
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none whitespace-nowrap"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Inbox className="w-8 h-8 opacity-40" />
                    <p className="text-xs">{emptyMessage}</p>
                    {emptyAction && <div className="pt-1">{emptyAction}</div>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <TableRow key={rowIdx} className="hover:bg-muted/30 transition-colors">
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className={`text-xs py-3.5 ${col.className || ''}`}>
                      {col.cell
                        ? col.cell(item, (currentPage - 1) * pageSize + rowIdx)
                        : col.accessorKey
                        ? item[col.accessorKey as string] ?? '-'
                        : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && filteredData.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 text-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="text-xs font-medium text-foreground px-1">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 text-xs flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export default DataTable;
