"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
  isDeleting,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-neutral-100">Delete project</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Are you sure you want to delete{" "}
            <span className="font-medium text-neutral-200">{projectName}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
