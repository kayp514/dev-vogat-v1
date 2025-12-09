import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchConversationProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab?: string;
};

export function SearchConversation(props: SearchConversationProps) {
  const { searchQuery, setSearchQuery, activeTab = "chats" } = props;

  const placeholder = activeTab === "contacts" 
    ? "Search contacts..." 
    : "Search conversations...";

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-8 bg-background/50 border-muted focus-visible:ring-1 focus-visible:ring-primary"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
