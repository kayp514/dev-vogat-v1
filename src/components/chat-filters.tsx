"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface ConversationFilterProps {
  filterOptions: {
    showOnlineOnly: boolean;
    showUnreadOnly: boolean;
  };
  setFilterOptions: (options: {
    showOnlineOnly: boolean;
    showUnreadOnly: boolean;
  }) => void;
}

type ConversationFiltersProps = {
  activeFilter: "all" | "unread" | "favorites";
  setActiveFilter: (filter: "all" | "unread" | "favorites") => void;
  unreadCount: number;
};

type ContactFilter = "all" | "requests" | "favorites";

export const ConversationFilter = ({
  filterOptions,
  setFilterOptions,
}: ConversationFilterProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Filter Conversations</h4>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="online-only"
              checked={filterOptions.showOnlineOnly}
              onCheckedChange={(checked) =>
                setFilterOptions({
                  ...filterOptions,
                  showOnlineOnly: checked === true,
                })
              }
            />
            <Label htmlFor="online-only">Online contacts only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="unread-only"
              checked={filterOptions.showUnreadOnly}
              onCheckedChange={(checked) =>
                setFilterOptions({
                  ...filterOptions,
                  showUnreadOnly: checked === true,
                })
              }
            />
            <Label htmlFor="unread-only">Unread messages only</Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ConversationFilters = ({
  activeFilter,
  setActiveFilter,
  unreadCount,
}: ConversationFiltersProps) => (
  <div className="bg-background/80 backdrop-blur-xs border-b px-2 py-2 z-10">
    <div className="flex space-x-1 rounded-lg bg-muted/50 p-1">
      <Button
        variant={activeFilter === "all" ? "default" : "ghost"}
        size="sm"
        className="flex-1 text-xs h-8"
        onClick={() => setActiveFilter("all")}
      >
        All
      </Button>
      <Button
        variant={activeFilter === "unread" ? "default" : "ghost"}
        size="sm"
        className="flex-1 text-xs h-8"
        onClick={() => setActiveFilter("unread")}
      >
        {unreadCount > 0 && (
          <Badge variant="destructive" className="mr-1.5 h-5 px-1.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
        Unread
      </Button>
    </div>
  </div>
);

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
    </div>
  </div>
);

export { ConversationFilters, ContactFilters };

export type { ConversationFiltersProps, ContactFilter };
