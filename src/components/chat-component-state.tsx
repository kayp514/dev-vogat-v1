import { LucideIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface LoadingProps {
  message?: string;
}

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  message: ReactNode;
  secondaryMessage?: ReactNode;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
}

const Loading = ({ message = "Loading..." }: LoadingProps) => (
  <div className="flex flex-col items-center justify-center h-40 gap-2">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const ErrorDisplay = ({ message, onRetry }: ErrorDisplayProps) => (
  <div className="flex flex-col items-center justify-center h-40 p-4 text-center gap-2">
    <p className="text-sm text-destructive">Error: {message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

const EmptyState = ({
  icon: Icon,
  message,
  secondaryMessage,
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
    {Icon && <Icon className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />}
    <p className="text-sm text-muted-foreground mb-1">{message}</p>
    {secondaryMessage && (
      <p className="text-xs text-muted-foreground">{secondaryMessage}</p>
    )}
    {action && (
      <Button
        variant="link"
        size="sm"
        className="mt-2"
        onClick={action.onClick}
      >
        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
        {action.label}
      </Button>
    )}
  </div>
);

export { Loading, ErrorDisplay, EmptyState };
