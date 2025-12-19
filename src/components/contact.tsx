"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Loader2,
  Search,
  X,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import type { User } from "@/app/type";
import { AddContactDialog } from "@/components/add-contact-dialog";

type Contact = {
  uid: string;
  name: string | null;
  email: string;
  avatar: string | null;
  phoneNumber: string | null;
  tenantId?: string;
  addedAt?: Date;
  status?: string;
};

type ContactRequest = {
  uid: string;
  name: string | null;
  email: string;
  avatar: string | null;
  phoneNumber: string | null;
  requestedAt?: Date;
  status: string;
};

type ContactFilter = "all" | "requests" | "favorites";

type ContactButtonProps = {
  contact: Contact;
  isSelected?: boolean;
  onSelectChat?: (user: User) => void;
};

const ContactButton = ({
  contact,
  isSelected = false,
  onSelectChat,
}: ContactButtonProps) => {
  const name =
    contact.name ||
    (contact.email ? contact.email.split("@")[0] : contact.uid.substring(0, 8));
  const avatarLetter = name[0]?.toUpperCase() || "U";

  const handleClick = () => {
    if (onSelectChat) {
      const user: User = {
        uid: contact.uid,
        name: contact.name || name,
        email: contact.email,
        avatar: contact.avatar || "",
      };
      onSelectChat(user);
    }
  };

  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  const truncateEmail = (email: string, maxLength: number = 22) => {
    if (email.length <= maxLength) return email;
    return `${email.substring(0, maxLength)}...`;
  };

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      className={`w-full justify-start p-3 h-auto hover:bg-accent/50 transition-colors cursor-pointer ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-center space-x-4 w-full">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            {contact.avatar ? (
              <AvatarImage src={contact.avatar} alt={name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {avatarLetter}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">{truncateName(name)}</span>
          </div>

          <div className="mt-1 space-y-0.5">
            {contact.email && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate">
                  {truncateEmail(contact.email)}
                </p>
              </div>
            )}
            {contact.phoneNumber && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate">
                  {contact.phoneNumber}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Button>
  );
};

// Contact Request Button Component (for pending requests)
const ContactRequestButton = ({
  request,
  onAccept,
  onReject,
  isProcessing,
}: {
  request: ContactRequest;
  onAccept: (uid: string) => void;
  onReject: (uid: string) => void;
  isProcessing: boolean;
}) => {
  const name =
    request.name ||
    (request.email ? request.email.split("@")[0] : request.uid.substring(0, 8));
  const avatarLetter = name[0]?.toUpperCase() || "U";

  return (
    <div className="w-full p-3 hover:bg-accent/50 transition-colors rounded-md">
      <div className="flex items-center space-x-4 w-full">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            {request.avatar ? (
              <AvatarImage src={request.avatar} alt={name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {avatarLetter}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold truncate">{name}</span>
          {request.email && (
            <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {request.email}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
            onClick={() => onAccept(request.uid)}
            disabled={isProcessing}
            title="Accept"
          >
            <UserCheck className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onReject(request.uid)}
            disabled={isProcessing}
            title="Decline"
          >
            <UserX className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ContactFilters = ({
  activeFilter,
  setActiveFilter,
  totalCount,
  requestsCount,
}: {
  activeFilter: ContactFilter;
  setActiveFilter: (filter: ContactFilter) => void;
  totalCount: number;
  requestsCount: number;
}) => (
  <div className="bg-background/80 backdrop-blur-xs border-b px-2 py-2 z-10">
    <div className="flex space-x-1 rounded-lg bg-muted/50 p-1">
      <Button
        variant={activeFilter === "all" ? "default" : "ghost"}
        size="sm"
        className="flex-1 text-xs h-8"
        onClick={() => setActiveFilter("all")}
      >
        {totalCount > 0 && (
          <Badge variant="secondary" className="mr-1.5 h-5 px-1.5">
            {totalCount > 99 ? "99+" : totalCount}
          </Badge>
        )}
        All
      </Button>
      <Button
        variant={activeFilter === "requests" ? "default" : "ghost"}
        size="sm"
        className="flex-1 text-xs h-8"
        onClick={() => setActiveFilter("requests")}
      >
        {requestsCount > 0 && (
          <Badge variant="destructive" className="mr-1.5 h-5 px-1.5">
            {requestsCount > 99 ? "99+" : requestsCount}
          </Badge>
        )}
        Requests
      </Button>
      <Button
        variant={activeFilter === "favorites" ? "default" : "ghost"}
        size="sm"
        className="flex-1 text-xs h-8"
        onClick={() => setActiveFilter("favorites")}
      >
        <span className="text-yellow-500 mr-1">★</span>
        Favorites
      </Button>
    </div>
  </div>
);

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

const Loading = () => (
  <div className="flex flex-col items-center justify-center h-40 gap-2">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    <p className="text-sm text-muted-foreground">Loading contacts...</p>
  </div>
);

const ErrorDisplay = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-40 p-4 text-center gap-2">
    <p className="text-sm text-destructive">Error: {message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

const EmptyState = ({
  activeFilter,
  searchQuery,
  onAddContact,
}: {
  activeFilter: ContactFilter;
  searchQuery: string;
  onAddContact?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
    <Users className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
    <p className="text-sm text-muted-foreground mb-1">
      {searchQuery
        ? "No contacts match your search"
        : activeFilter === "requests"
        ? "No pending requests"
        : activeFilter === "favorites"
        ? "No favorite contacts"
        : "No contacts yet"}
    </p>
    {!searchQuery && activeFilter === "all" && (
      <>
        <p className="text-xs text-muted-foreground">
          Add contacts to start chatting
        </p>
        <Button
          variant="link"
          size="sm"
          className="mt-2"
          onClick={onAddContact}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </>
    )}
  </div>
);

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
    if (activeFilter === "favorites") {
      // TODO: Implement favorites logic when backend supports it
      return false;
    }
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

      <ScrollArea className="h-[calc(100vh-280px)]">
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
                <EmptyState
                  activeFilter={activeFilter}
                  searchQuery=""
                  onAddContact={handleOpenAddDialog}
                />
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
                  activeFilter={activeFilter}
                  searchQuery={searchQuery}
                  onAddContact={handleOpenAddDialog}
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
