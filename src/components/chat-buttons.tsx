import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/app/type";
import type {
  UserStatus,
  ChatMessage,
} from "@/ternsecure-realtime/utils/socket";
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence";
import { useChat } from "@/ternsecure-realtime";
import { Button } from "@/components/ui/button";
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

type ConversationButtonProps = {
  user: User;
  isSelected: boolean;
  onSelect: (user: User) => void;
  lastMessage?: ChatMessage;
  presence?: UserStatus;
};

type ContactButtonProps = {
  contact: Contact;
  isSelected?: boolean;
  onSelectChat?: (user: User) => void;
};

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

const ConversationButton = (props: ConversationButtonProps) => {
  const { user, isSelected, onSelect, lastMessage } = props;
  const { presenceUpdates } = usePresence();
  const { isTyping } = useChat();

  const name =
    user.name ||
    (user.email ? user.email.split("@")[0] : user.uid.substring(0, 8));
  const avatarLetter = name[0]?.toUpperCase() || "U";

  const userPresence = presenceUpdates.find(
    (update) => update.clientId === user.uid
  )?.presence;

  const isUserTyping = Boolean(isTyping[user.uid]);

  const formatMessageTime = (timestamp: string) => {
    const distance = formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
    });
    return distance === "less than a minute ago" ? "now" : distance;
  };

  const truncateMessage = (message: string, maxLength: number = 30) => {
    if (message.length <= maxLength) return message;
    return `${message.substring(0, maxLength)}...`;
  };

  return (
    <Button
      key={user.uid}
      onClick={() => onSelect(user)}
      variant="ghost"
      className={`w-full justify-start p-3 h-auto hover:bg-accent/50 transition-colors cursor-pointer ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-center space-x-4 w-full">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {avatarLetter}
              </AvatarFallback>
            )}
          </Avatar>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-background ${
              userPresence?.status === "online"
                ? "bg-green-500"
                : userPresence?.status === "busy"
                ? "bg-red-500"
                : userPresence?.status === "away"
                ? "bg-yellow-500"
                : userPresence?.status === "offline"
                ? "bg-gray-400"
                : "bg-slate-300"
            }`}
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold truncate">{name}</span>
            {lastMessage?.timestamp && (
              <span className="text-xs text-muted-foreground shrink-0">
                {formatMessageTime(lastMessage.timestamp)}
              </span>
            )}
          </div>

          <div className="mt-1">
            {isUserTyping ? (
              <p className="text-xs text-muted-foreground italic">Typing...</p>
            ) : lastMessage ? (
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {lastMessage.fromId === user.uid ? `${name}: ` : "You: "}
                  {truncateMessage(lastMessage.message)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No messages yet</p>
            )}
          </div>
        </div>
      </div>
    </Button>
  );
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

export { ConversationButton, ContactButton, ContactRequestButton };

export type { Contact, ContactRequest };
