"use client";

import { useState, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { UsersDataTable } from "./table-users";
import { columns } from "@/components/columns-users";
import { UsersTableSkeleton } from "@/components/skeleton";
import { fetcher } from "@/lib/utils";
import type { UserData } from "@/types";
import type { PaginationState } from "@tanstack/react-table";

const API = "https://api-vogat.vercel.app";
const API_VERSION = "v1";
const USERS_ENDPOINT = "users";
const MAX_RESULTS = 1000;
const ITEMS_PER_PAGE = 10;

const usersFetcher = async (page: number) => {
  const params = new URLSearchParams({
    maxResults: MAX_RESULTS.toString(),
  });

  //if (page > 1) {
  //  const offset = (page - 1) * MAX_RESULTS;
   // params.append("nextPage", offset.toString());
 //}

  const url = `${API}/${API_VERSION}/${USERS_ENDPOINT}?${params.toString()}`;
  const result = await fetcher(url);

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to fetch users");
  }

  return {
    users: result.users.slice((page-1) * 10, (page) * 10),
    pageCount: result.totalPages,
    rowCount: result.totalCount,
    hasMore: result.hasMore,
  };
};

function UserList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["users", currentPage],
    queryFn: () => usersFetcher(currentPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });

  const users = data?.users || [];
  //const pageCountAPI = data?.totalPages || 0;
  //console.log("Total Pages from API:", pageCountAPI);
  const pageCount = data?.pageCount || 0;
  console.log("pageCount", pageCount)
  const hasMore = data?.hasMore || false;
  //const rowCount = data?.totalCount || 0;
  //console.log("Total Count from API:", rowCount);
  const rowCount = data?.rowCount || 0;
  console.log("rowCount", rowCount)


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
  console.log("Total Row Count on Client:", totalUsers);

  //const pageCount = Math.ceil(totalUsers / ITEMS_PER_PAGE);
  //console.log("PageCount on client:", pageCount);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);
  const u = filteredUsers.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

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
      rowCount={rowCount}
      totalPages={pageCount}
      currentPage={currentPage}
      onPageChange={onPageChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      isFetching={isFetching}
      isPlaceholderData={isPlaceholderData}
      hasMore={hasMore}
      itemsPerPage={ITEMS_PER_PAGE}
    />
  );
}

export function ConsoleUser() {
  return <UserList />;
}
