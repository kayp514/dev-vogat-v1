"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Columns } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { UserData } from "@/types";

interface UsersSearchFiltersProps {
  table: Table<UserData>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  disabled?: boolean
}

export function UsersSearchFilters({
  table,
  globalFilter,
  setGlobalFilter,
  disabled = false,
}: UsersSearchFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 pb-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="pl-8 w-full sm:w-[300px]"
            disabled={disabled}
          />
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto bg-transparent" disabled={disabled}>
            <Columns className="mr-2 h-4 w-4" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id === "uid"
                    ? "User ID"
                    : column.id === "createdAt"
                    ? "Created"
                    : column.id === "lastSignInAt"
                    ? "Last Sign In"
                    : column.id === "disabled"
                    ? "Status"
                    : column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
