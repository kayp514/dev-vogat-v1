"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Mail, Phone } from "lucide-react";
import { useEffect } from "react";
import type { Contact } from "@/ternsecure-realtime/utils/socket";
import { useContactSearch } from "@/hooks/use-contact-search";

type ContactButtonProps = {
  contact: Contact;
  onSelect?: (contact: Contact) => void;
};

const ContactButton = ({ contact, onSelect }: ContactButtonProps) => {
  const name =
    contact.name ||
    (contact.email ? contact.email.split("@")[0] : contact.uid.substring(0, 8));
  const avatarLetter = name[0]?.toUpperCase() || "U";

  return (
    <Button
      onClick={() => onSelect?.(contact)}
      variant="ghost"
      className="w-full justify-start p-3 h-auto hover:bg-accent/50 transition-colors cursor-pointer"
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
            <span className="text-sm font-semibold truncate">{name}</span>
          </div>

          <div className="mt-1 space-y-0.5">
            {contact.email && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate">
                  {contact.email}
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
  <div className="flex items-center justify-center h-20">
    <p className="text-sm text-muted-foreground">Loading contacts...</p>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-20">
    <p className="text-sm text-destructive">Error: {message}</p>
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

export function Contact() {
  const { contacts, isPending, error, loadContacts } = useContactSearch();

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return (
    <ScrollArea className="flex-1 h-[calc(100vh-225px)]">
      <div className="space-y-1 p-2">
        {isPending && <Loading />}
        {error && <ErrorDisplay message={error} />}
        {!isPending && !error && contacts.length === 0 && <EmptyState />}
        {!isPending &&
          !error &&
          contacts.length > 0 &&
          contacts.map((contact) => (
            <ContactButton key={contact.uid} contact={contact} />
          ))}
      </div>
    </ScrollArea>
  );
}
