"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { useDebounce } from "./use-debounce";

interface WorkspaceUser {
  uid: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: string;
  joinedAt: Date;
}

interface UseWorkspaceSearchOptions {
  workspaceId: string;
  limit?: number;
}

const API = "https://api-vogat.vercel.app/v1";

export function useWorkspaceSearch({
  workspaceId,
  limit = 10,
}: UseWorkspaceSearchOptions) {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const updateSearchQuery = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (!query.trim()) {
        setUsers([]);
        setError(null);
        return;
      }

      if (!workspaceId) {
        setError("Workspace ID is required");
        return;
      }

      startTransition(async () => {
        try {
          const response = await fetch(
            `${API}/workspace/${workspaceId}/search?q=${encodeURIComponent(
              query
            )}&limit=${limit}`
          );
          const data = await response.json();

          if (data.success) {
            setUsers(data.users);
            setError(null);
          } else {
            setUsers([]);
            setError(data.error?.message || "Search failed");
          }
        } catch (error) {
          console.error("Workspace search error:", error);
          setUsers([]);
          setError("Failed to search workspace members");
        }
      });
    },
    [workspaceId, limit]
  );

  useEffect(() => {
    setUsers([]);
    setSearchQuery("");
    setError(null);
  }, [workspaceId]);

  return {
    users,
    searchQuery,
    isPending,
    error,
    updateSearchQuery,
    clearSearch: useCallback(() => {
      setSearchQuery("");
      setUsers([]);
      setError(null);
    }, []),
  };
}
