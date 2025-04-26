"use client";

import { useState } from "react";
import { MessageSquare, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentIds: string[];
  onSuccess?: () => void;
}

export function SendMessageDialog({
  open,
  onOpenChange,
  studentIds,
  onSuccess,
}: SendMessageDialogProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addAttachment = () => {
    if (attachmentInput.trim()) {
      setAttachments((prev) => [...prev, attachmentInput.trim()]);
      setAttachmentInput("");
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (studentIds.length === 0) {
      toast.error("No students selected for messaging");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/mentor/messages/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentIds,
          content,
          attachments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send messages");
      }

      const data = await response.json();
      toast.success(`Message sent to ${data.count} student(s)`);

      // Reset form
      setContent("");
      setAttachments([]);

      // Close dialog
      onOpenChange(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error sending messages:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send messages"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a direct message to {studentIds.length} selected student
            {studentIds.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attachment">Attachments (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="attachment"
                placeholder="Enter attachment URL"
                value={attachmentInput}
                onChange={(e) => setAttachmentInput(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addAttachment}
                disabled={isLoading || !attachmentInput.trim()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add links to resources, files, or documents
            </p>
          </div>

          {attachments.length > 0 && (
            <div>
              <Label>Added Attachments</Label>
              <ul className="mt-2 space-y-1 rounded-md border p-2">
                {attachments.map((attachment, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{attachment}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
