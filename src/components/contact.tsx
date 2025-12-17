"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Mail, Phone, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import type { User } from "@/app/type";

type Contact = {
  uid: string;
  name: string | null;
  email: string;
  avatar: string | null;
  phoneNumber: string | null;
  tenantId?: string;
  addedAt?: Date;
};

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

  const truncateName = (name: string, maxLength: number = 10) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  const truncateEmail = (email: string, maxLength: number = 20) => {
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

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
    <Users className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
    <p className="text-sm text-muted-foreground mb-1">No contacts yet</p>
    <p className="text-xs text-muted-foreground">
      Add contacts to start chatting
    </p>
    <Button variant="link" size="sm" className="mt-2">
      <UserPlus className="h-4 w-4 mr-2" />
      Add Contact
    </Button>
  </div>
);

type ContactProps = {
  selectedUserId?: string;
  onSelectChat?: (user: User) => void;
};

export function Contact({ selectedUserId, onSelectChat }: ContactProps) {
  const fetchContacts = async ({ pageParam = 0 }: { pageParam?: number }) => {
    const res = await fetcher(`/api/contacts?cursor=${pageParam}&limit=20`);
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
    queryKey: ["contacts"],
    queryFn: fetchContacts,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const contacts = data?.pages.flatMap((page) => page.contacts) ?? [];

  return (
    <ScrollArea className="h-[calc(100vh-225px)]">
      <div className="space-y-1 p-2 pb-4">
        {status === "pending" && <Loading />}
        {status === "error" && (
          <ErrorDisplay
            message={error?.message || "Failed to load contacts"}
            onRetry={() => refetch()}
          />
        )}

        {status === "success" && contacts.length === 0 && <EmptyState />}

        {status === "success" && contacts.length > 0 && (
          <>
            {contacts.map((contact) => (
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
      </div>
    </ScrollArea>
  );
}
