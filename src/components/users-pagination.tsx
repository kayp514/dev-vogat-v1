"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface UsersPaginationProps {
  totalUsers: number
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function UsersPagination({
  totalUsers,
  totalPages,
  currentPage,
  onPageChange,
  isLoading = false,
}: UsersPaginationProps) {
  const handlePreviousPage = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1)
    }
  }

  const canGoPrevious = currentPage > 1 && !isLoading
  const canGoNext = currentPage < totalPages && !isLoading

  const startItem = totalUsers === 0 ? 0 : (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalUsers)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 p-4 pt-3 border-t">
      <div className="flex-1 text-sm text-muted-foreground text-center sm:text-left">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading users...
          </div>
        ) : (
          `Showing ${startItem} to ${endItem} of ${totalUsers} user(s)`
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select value="10" disabled={isLoading}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `Page ${currentPage} of ${Math.max(1, totalPages)}`
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0 bg-transparent"
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 bg-transparent"
            onClick={handleNextPage}
            disabled={!canGoNext}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
