"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, X, Users, UserPlus } from "lucide-react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import type { User } from "@/app/type";
import { AddContactDialog } from "@/components/add-contact-dialog";
import { ContactRequestButton, ContactButton } from "@/components/chat-buttons";
import type { Contact, ContactRequest } from "@/components/chat-buttons";
import { ContactFilters } from "@/components/chat-filters";
import type { ContactFilter } from "@/components/chat-filters";
import {
  EmptyState,
  ErrorDisplay,
  Loading,
} from "@/components/chat-component-state";

const ContactHeader = ({
  searchQuery,
  setSearchQuery,
  onContactAdded,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onContactAdded?: () => void;
}) => {
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  return (
    <div className="p-3 border-b bg-background/80 backdrop-blur-xs sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-8 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <AddContactDialog
          open={isAddContactOpen}
          onOpenChange={setIsAddContactOpen}
          onContactAdded={onContactAdded}
        />
      </div>
    </div>
  );
};

type ContactProps = {
  selectedUserId?: string;
  onSelectChat?: (user: User) => void;
};

export function Contact({ selectedUserId, onSelectChat }: ContactProps) {
  const [activeFilter, setActiveFilter] = useState<ContactFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );
  const queryClient = useQueryClient();

  // Fetch contacts
  const fetchContacts = async ({ pageParam = 0 }: { pageParam?: number }) => {
    const url = searchQuery
      ? `/api/contacts?q=${encodeURIComponent(
          searchQuery
        )}&cursor=${pageParam}&limit=20`
      : `/api/contacts?cursor=${pageParam}&limit=20`;
    const res = await fetcher(url);
    return res;
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["contacts", searchQuery],
    queryFn: fetchContacts,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  // Fetch pending requests
  const {
    data: requestsData,
    status: requestsStatus,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ["contact-requests"],
    queryFn: () => fetcher("/api/contacts/requests"),
  });

  const contacts = data?.pages.flatMap((page) => page.contacts) ?? [];
  const pendingRequests: ContactRequest[] = requestsData?.requests ?? [];
  const requestsCount = requestsData?.count ?? 0;

  // Filter contacts based on active filter
  const filteredContacts = contacts.filter((contact) => {
    if (activeFilter === "requests") {
      return false; // Requests are shown separately
    }
    return true;
  });

  const handleContactAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    refetch();
  };

  const handleOpenAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  const handleAcceptRequest = async (requesterId: string) => {
    setProcessingRequest(requesterId);
    try {
      const response = await fetch("/api/contacts/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId, action: "accept" }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        refetchRequests();
        refetch();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    setProcessingRequest(requesterId);
    try {
      const response = await fetch("/api/contacts/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId, action: "reject" }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
        refetchRequests();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const showRequests = activeFilter === "requests";

  return (
    <>
      <ContactHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onContactAdded={handleContactAdded}
      />

      <ContactFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        totalCount={contacts.length}
        requestsCount={requestsCount}
      />

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-1 p-2 pb-4">
          {showRequests ? (
            <>
              {requestsStatus === "pending" && <Loading />}
              {requestsStatus === "error" && (
                <ErrorDisplay
                  message="Failed to load requests"
                  onRetry={() => refetchRequests()}
                />
              )}
              {requestsStatus === "success" && pendingRequests.length === 0 && (
                <EmptyState icon={Users} message="No pending requests" />
              )}
              {requestsStatus === "success" && pendingRequests.length > 0 && (
                <>
                  {pendingRequests.map((request) => (
                    <ContactRequestButton
                      key={request.uid}
                      request={request}
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                      isProcessing={processingRequest === request.uid}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {status === "pending" && <Loading />}
              {status === "error" && (
                <ErrorDisplay
                  message={error?.message || "Failed to load contacts"}
                  onRetry={() => refetch()}
                />
              )}

              {status === "success" && filteredContacts.length === 0 && (
                <EmptyState
                  icon={Users}
                  message={
                    searchQuery
                      ? "No contacts match your search"
                      : activeFilter === "favorites"
                      ? "No favorite contacts"
                      : "No contacts yet"
                  }
                  secondaryMessage={
                    !searchQuery && activeFilter === "all"
                      ? "Add contacts to start chatting"
                      : undefined
                  }
                  action={
                    !searchQuery && activeFilter === "all"
                      ? {
                          label: "Add Contact",
                          icon: UserPlus,
                          onClick: handleOpenAddDialog,
                        }
                      : undefined
                  }
                />
              )}

              {status === "success" && filteredContacts.length > 0 && (
                <>
                  {filteredContacts.map((contact) => (
                    <ContactButton
                      key={contact.uid}
                      contact={contact}
                      isSelected={selectedUserId === contact.uid}
                      onSelectChat={onSelectChat}
                    />
                  ))}

                  {(hasNextPage || isFetchingNextPage) && (
                    <div className="flex justify-center pt-4 pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchNextPage()}
                        disabled={!hasNextPage || isFetchingNextPage}
                        className="text-muted-foreground"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading more...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
