"use client";

import { useState } from "react";
import { HardDriveDownload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";

export function LocalModeIndicator() {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-8 px-2 flex items-center gap-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors"
        title="Local mode — data stored in browser"
      >
        <HardDriveDownload className="h-4 w-4" />
        <span className="text-xs font-medium">Local</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDriveDownload className="h-5 w-5 text-amber-400" />
              Local Mode
            </DialogTitle>
            <DialogDescription>
              You&apos;re using Artifex without an account. Here&apos;s what you should know.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-neutral-200 mb-1">Where is my data stored?</h4>
              <p className="text-neutral-400">
                Your projects are saved in this browser&apos;s local storage (IndexedDB). Data never leaves your device.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-neutral-200 mb-1">What works?</h4>
              <p className="text-neutral-400">
                All features including chat, code editing, checkpoints, skills, and rules work fully in local mode.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-neutral-200 mb-1">Limitations</h4>
              <ul className="text-neutral-400 list-disc list-inside space-y-1">
                <li>Publishing is not available</li>
                <li>Data is only accessible in this browser</li>
                <li>Clearing browser data will delete your projects</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-neutral-400 mb-3">
                Sign up to save your projects to the cloud and unlock publishing.
              </p>
              <Button
                onClick={() => {
                  setOpen(false);
                  setAuthOpen(true);
                }}
                className="w-full"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultMode="signup"
      />
    </>
  );
}
