import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, X, Check, Loader2 } from "lucide-react";

type AddContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactAdded?: () => void;
};

export function AddContactDialog({
  open,
  onOpenChange,
  onContactAdded,
}: AddContactDialogProps) {
  const [identifier, setIdentifier] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddContact = async () => {
    if (!identifier.trim()) return;

    setIsAdding(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to add contact");
      }

      setSuccess(true);
      setIdentifier("");
      onContactAdded?.();

      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setIdentifier("");
    setError(null);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Add Contact"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Add New Contact</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Add a contact by email or phone number
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-identifier">Email or Phone</Label>
            <Input
              id="contact-identifier"
              placeholder="email@example.com or +1234567890"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && identifier.trim()) {
                  handleAddContact();
                }
              }}
              disabled={isAdding || success}
            />
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded-md">
              <Check className="h-4 w-4" />
              Contact added successfully!
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleAddContact}
            disabled={!identifier.trim() || isAdding || success}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Added!
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
