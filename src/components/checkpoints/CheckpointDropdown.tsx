"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { createCheckpoint } from "@/actions/create-checkpoint";
import { getCheckpoints } from "@/actions/get-checkpoints";
import { deleteCheckpoint } from "@/actions/delete-checkpoint";
import { restoreCheckpoint } from "@/actions/restore-checkpoint";

interface Checkpoint {
  id: string;
  name: string;
  createdAt: Date;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CheckpointDropdown({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [name, setName] = useState(() => new Date().toLocaleString());
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Checkpoint | null>(null);
  const [restoring, setRestoring] = useState(false);

  const load = async () => {
    const data = await getCheckpoints(projectId);
    setCheckpoints(data);
  };

  useEffect(() => {
    if (open) {
      setName(new Date().toLocaleString());
      setNameError(false);
      load();
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setSaving(true);
    try {
      await createCheckpoint(projectId, name.trim());
      setName(new Date().toLocaleString());
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCheckpoint(id);
    setCheckpoints((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await restoreCheckpoint(restoreTarget.id);
      setRestoreTarget(null);
      setOpen(false);
      window.location.reload();
    } catch {
      setRestoring(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="p-2.5 rounded-lg transition-all hover:bg-neutral-700"
            aria-label="Checkpoints"
          >
            <History className="h-4 w-4 text-neutral-500 hover:text-neutral-300" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-80 p-0">
          <div className="p-3 border-b border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Checkpoint name..."
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className={`flex-1 min-w-0 text-sm bg-neutral-800 border rounded-md px-2.5 py-1.5 text-neutral-200 placeholder:text-neutral-500 outline-none ${nameError ? "border-red-500 focus:border-red-500" : "border-neutral-700 focus:border-neutral-600"}`}
            />
            <Button
              size="sm"
              className="h-7 px-3"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </Button>
            </div>
            {nameError && <p className="text-xs text-red-400">Name is required.</p>}
          </div>

          <div className="max-h-60 overflow-y-auto">
            {checkpoints.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-neutral-500">
                No checkpoints yet.
              </div>
            ) : (
              checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-800/50 group"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-neutral-200 truncate">
                      {cp.name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {timeAgo(cp.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-neutral-400 hover:text-neutral-200"
                      onClick={() => setRestoreTarget(cp)}
                      title="Restore"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-neutral-400 hover:text-red-400"
                      onClick={() => handleDelete(cp.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {(saving || restoring) && (
        <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <span className="text-sm text-neutral-400">
              {saving ? "Saving checkpoint..." : "Restoring checkpoint..."}
            </span>
          </div>
        </div>
      )}

      <Dialog open={!!restoreTarget} onOpenChange={(v) => !v && setRestoreTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore checkpoint</DialogTitle>
            <DialogDescription>
              This will replace your current files with the snapshot from
              &quot;{restoreTarget?.name}&quot;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
