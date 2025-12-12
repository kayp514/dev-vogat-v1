"use client";

import { useState, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { UsersDataTable } from "./table-users";
import { columns } from "@/components/columns-users";
import { UsersTableSkeleton } from "@/components/skeleton";
import { fetcher } from "@/lib/utils";
import type { UserData } from "@/types";

const API = "https://api-vogat.vercel.app";
const API_VERSION = "v1";
const USERS_ENDPOINT = "users";

const usersFetcher = async (page: number) => {
  const params = new URLSearchParams({
    maxResults: "100",
  });

  if (page > 1) {
    const offset = (page - 1) * 10;
    params.append("nextPage", offset.toString());
  }

  const url = `${API}/${API_VERSION}/${USERS_ENDPOINT}?${params.toString()}`;
  const result = await fetcher(url);

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to fetch users");
  }

  return result;
};

function UserList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const itemsPerPage = 10;

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["users", currentPage],
    queryFn: () => usersFetcher(currentPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });

  const users = data?.users || [];
  const serverTotalUsers = data?.totalCount || 0;
  const serverTotalPages = data?.totalPages || 0;

  const filteredUsers = useMemo(() => {
    if (!globalFilter) return users;

    const searchTerm = globalFilter.toLowerCase();
    return users.filter(
      (user: UserData) =>
        user.email.toLowerCase().includes(searchTerm) ||
        user.uid.toLowerCase().includes(searchTerm) ||
        (user.customClaims?.role &&
          user.customClaims.role.toLowerCase().includes(searchTerm))
    );
  }, [users, globalFilter]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  if (isPending) return <UsersTableSkeleton />;

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const onGlobalFilterChange = (value: string) => {
    setGlobalFilter(value);
    setCurrentPage(1);
  };

  return (
    <UsersDataTable
      columns={columns}
      data={currentUsers}
      totalUsers={totalUsers}
      totalPages={totalPages}
      currentPage={currentPage}
      onPageChange={onPageChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      isLoading={false}
    />
  );
}

export function ConsoleUser() {
  return <UserList />;
}
