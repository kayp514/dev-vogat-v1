"use client";

import { useState, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { UsersDataTable } from "./table-users";
import { UsersTableSkeleton } from "@/components/skeleton";
import { fetcher } from "@/lib/utils";
import type { UserData } from "@/types";

const API = "https://api-vogat.vercel.app";
const API_VERSION = "v1";
const USERS_ENDPOINT = "users";
const MAX_RESULTS = 100;
const DEFAULT_ITEMS_PER_PAGE = 10;

const usersFetcher = async (page: number) => {
  const params = new URLSearchParams({
    maxResults: MAX_RESULTS.toString(),
  });

  if (page > 1) {
    params.append("nextPage", page.toString());
  }

  const url = `${API}/${API_VERSION}/${USERS_ENDPOINT}?${params.toString()}`;
  const result = await fetcher(url);

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to fetch users");
  }

  return {
    users: result.users,
    currentPage: result.currentPage,
    pageCount: result.totalPages,
    rowCount: result.totalCount,
    hasMore: result.hasMore,
  };
};

function UserList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  // Calculate the API page based on the current UI page
  const apiPage =
    Math.floor(((currentPage - 1) * itemsPerPage) / MAX_RESULTS) + 1;

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["users", apiPage],
    queryFn: () => usersFetcher(apiPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });

  const users = data?.users || [];
  const hasMore = data?.hasMore || false;
  const totalCount = data?.rowCount || 0;

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

  // If filtering, we only have the current batch. If not, we use the total count from API.
  const totalUsers = globalFilter ? filteredUsers.length : totalCount;
  const pageCount = Math.ceil(totalUsers / itemsPerPage);

  // Calculate the slice of users to display
  let currentUsers: UserData[] = [];
  if (globalFilter) {
    // When filtering, we paginate the filtered results of the current batch
    const startIndex = (currentPage - 1) * itemsPerPage;
    currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  } else {
    // When not filtering, we slice the current batch based on the page offset within the batch
    const startIndex = ((currentPage - 1) * itemsPerPage) % MAX_RESULTS;
    currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }

  if (isPending) return <UsersTableSkeleton />;

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const onGlobalFilterChange = (value: string) => {
    setGlobalFilter(value);
    setCurrentPage(1);
  };

  const onItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  return (
    <UsersDataTable
      data={currentUsers}
      totalUsers={totalUsers}
      rowCount={totalUsers}
      totalPages={pageCount}
      currentPage={currentPage}
      onPageChange={onPageChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      isFetching={isFetching}
      isPlaceholderData={isPlaceholderData}
      hasMore={hasMore}
      itemsPerPage={itemsPerPage}
      onItemsPerPageChange={onItemsPerPageChange}
    />
  );
}

export function ConsoleUser() {
  return <UserList />;
}
