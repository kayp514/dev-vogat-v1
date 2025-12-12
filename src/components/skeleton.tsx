import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TableRow, TableCell } from "@/components/ui/table"

export function UsersTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      {/* Table Card Skeleton */}
      <Card className="overflow-hidden">
        {/* Search and Filters Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-[300px]" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Table Header Skeleton */}
        <div className="border-t">
          <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted/50">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>

          {/* Table Rows Skeleton */}
          <div className="divide-y">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 p-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 p-4 pt-3 border-t">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-5 w-24" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}


export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* System Status Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Skeleton className="h-4 w-4 mr-3" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


export function UsersPaginationSkeleton({ rowCount = 10 }: { rowCount?: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <TableRow key={i} className="hover:bg-muted/50 animate-pulse">
          {/* Email Column */}
          <TableCell className="px-2 py-3 max-w-[200px]">
            <div className="flex items-center min-w-0">
              <Skeleton className="h-5 w-full max-w-[180px]" />
            </div>
          </TableCell>

          {/* User ID Column (hidden by default) */}
          <TableCell className="px-2 py-3">
            <Skeleton className="h-4 w-24" />
          </TableCell>

          {/* Role Column (hidden by default) */}
          <TableCell className="px-2 py-3">
            <Skeleton className="h-6 w-16 rounded-full" />
          </TableCell>

          {/* Created Column */}
          <TableCell className="px-2 py-3">
            <Skeleton className="h-5 w-20" />
          </TableCell>

          {/* Last Sign In Column */}
          <TableCell className="px-2 py-3">
            <Skeleton className="h-5 w-24" />
          </TableCell>

          {/* Status Column */}
          <TableCell className="px-2 py-3">
            <Skeleton className="h-6 w-20 rounded-full" />
          </TableCell>

          {/* Actions Column */}
          <TableCell className="px-2 py-3">
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}



