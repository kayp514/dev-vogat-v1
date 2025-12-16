"use client";

import { useState, useCallback, useTransition } from "react";
import { useDebounce } from "./use-debounce";

interface Contact {
  uid: string;
  name: string | null;
  email: string;
  avatar: string | null;
  phoneNumber: string | null;
  tenantId: string;
  addedAt?: Date;
}

interface UseContactSearchOptions {
  limit?: number;
}

/**
 * Hook for searching user's personal contacts
 * Uses the contact-list API which automatically filters by authenticated user
 * No workspaceId needed - server-side auth handles it
 */
export function useContactSearch(options?: UseContactSearchOptions) {
  const { limit = 20 } = options || {};

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const updateSearchQuery = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (!query.trim()) {
        // Load all contacts when search is empty
        startTransition(async () => {
          try {
            const response = await fetch(`/api/contacts`);
            const data = await response.json();

            if (data.success) {
              setContacts(data.contacts);
              setError(null);
            } else {
              setError(data.error?.message || "Failed to load contacts");
              setContacts([]);
            }
          } catch (err) {
            setError("Failed to load contacts");
            setContacts([]);
            console.error("Error loading contacts:", err);
          }
        });
        return;
      }

      // Search contacts with query
      startTransition(async () => {
        try {
          const response = await fetch(
            `/api/contacts?q=${encodeURIComponent(query)}&limit=${limit}`
          );
          const data = await response.json();

          if (data.success) {
            setContacts(data.contacts);
            setError(null);
          } else {
            setError(data.error?.message || "Failed to search contacts");
            setContacts([]);
          }
        } catch (err) {
          setError("Failed to search contacts");
          setContacts([]);
          console.error("Error searching contacts:", err);
        }
      });
    },
    [limit]
  );

  // Load all contacts on mount
  const loadContacts = useCallback(() => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/contacts`);
        const data = await response.json();

        if (data.success) {
          setContacts(data.contacts);
          setError(null);
        } else {
          setError(data.error?.message || "Failed to load contacts");
        }
      } catch (err) {
        setError("Failed to load contacts");
        console.error("Error loading contacts:", err);
      }
    });
  }, []);

  return {
    contacts,
    searchQuery,
    isPending,
    error,
    updateSearchQuery,
    loadContacts,
  };
}
