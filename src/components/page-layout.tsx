import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">{title}</h1>
        {description && <p className="text-muted-foreground dark:text-gray-300 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}



export function PageWrapper({ children, className }: PageWrapperProps) {
  return <div className={cn("space-y-6", className)}>{children}</div>
}