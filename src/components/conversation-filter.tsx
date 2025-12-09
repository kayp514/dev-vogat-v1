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

export function ConversationFilter({
  filterOptions,
  setFilterOptions,
}: ConversationFilterProps) {
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
}
