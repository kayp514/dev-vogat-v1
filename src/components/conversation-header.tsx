"use client"
import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare, Users } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NewMessageDialog } from "./new-message-dialog"

interface ConversationHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  filterOptions: {
    showOnlineOnly: boolean
    showUnreadOnly: boolean
  }
  setFilterOptions: (options: {
    showOnlineOnly: boolean
    showUnreadOnly: boolean
  }) => void
}

export function ConversationHeader({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  filterOptions,
  setFilterOptions,
}: ConversationHeaderProps) {
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b bg-background/80 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Messages</h2>
          <div className="flex items-center gap-2">
            <NewMessageDialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen} />
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
                        setFilterOptions({ ...filterOptions, showOnlineOnly: checked === true })
                      }
                    />
                    <Label htmlFor="online-only">Online contacts only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unread-only"
                      checked={filterOptions.showUnreadOnly}
                      onCheckedChange={(checked) =>
                        setFilterOptions({ ...filterOptions, showUnreadOnly: checked === true })
                      }
                    />
                    <Label htmlFor="unread-only">Unread messages only</Label>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8 bg-background/50 border-muted focus-visible:ring-1 focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-background sticky top-[89px] z-10">
        <TabsList className="w-full rounded-none border-b p-0 h-12 grid grid-cols-2 gap-0">
          <TabsTrigger
            value="chats"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center justify-center gap-2 transition-all h-full"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">Chats</span>
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center justify-center gap-2 transition-all h-full"
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">Contacts</span>
          </TabsTrigger>
        </TabsList>
      </div>
    </>
  )
}

