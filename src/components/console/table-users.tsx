import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageWrapper, PageHeaderVogat } from "@/components/page-layout";
import { UsersSearchFilters } from "@/components/users-search";
import type { UserData } from "@/types";
import { UsersPagination } from "@/components/users-pagination";

type UsersDataTableProps = {
  columns: ColumnDef<UserData>[];
  data: UserData[];
  totalUsers: number;
  rowCount: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  isFetching?: boolean;
  isPlaceholderData?: boolean;
  hasMore?: boolean;
  itemsPerPage: number;
};

export function UsersDataTable(props: UsersDataTableProps) {
  const {
    data,
    columns,
    globalFilter,
    onGlobalFilterChange,
    isFetching,
    isPlaceholderData,
    hasMore,
    itemsPerPage,
  } = props;
  const [sorting, setSorting] = useState<SortingState>([]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    uid: false,
    role: false,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: props.currentPage - 1,
    pageSize: itemsPerPage,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    //getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    manualPagination: true,
    rowCount: props.rowCount
  });

  return (
    <PageWrapper>
      <PageHeaderVogat
        title="User Management"
        description="Manage user accounts and permissions"
      />
      <div>
        <UsersSearchFilters
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={onGlobalFilterChange}
          disabled={isFetching}
        />
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => {
                    if (cell.column.id === "actions") {
                      return (
                        <TableCell
                          key={cell.id}
                          className="px-2 py-3 align-top"
                        ></TableCell>
                      );
                    }
                    return (
                      <TableCell key={cell.id} className="px-2 py-3 align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <UsersPagination
          table={table}
          totalUsers={props.totalUsers}
          totalPages={props.totalPages}
          currentPage={props.currentPage}
          onPageChange={props.onPageChange}
          isFetching={isFetching}
          isPlaceholderData={isPlaceholderData}
          hasMore={hasMore}
          rowCount={props.rowCount}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </PageWrapper>
  );
}
