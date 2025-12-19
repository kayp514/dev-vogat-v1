import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ConversationSearchProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const ConversationSearch = ({
  searchQuery,
  setSearchQuery,
}: ConversationSearchProps) => {
  return (
    <div className="p-3 border-b bg-background/80 backdrop-blur-xs sticky top-0 z-10">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-8 h-9 text-sm bg-background/50 border-muted focus-visible:ring-1 focus-visible:ring-primary"
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
    </div>
  );
};

export { ConversationSearch };
