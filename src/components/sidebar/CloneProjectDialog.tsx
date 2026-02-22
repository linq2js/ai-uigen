"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CloneProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: (options: {
    name: string;
    includeSourceCode: boolean;
    includeMessages: boolean;
    includeSkills: boolean;
    includeRules: boolean;
    fromMessageIndex?: number;
  }) => void;
  isCloning: boolean;
  fromMessageIndex?: number;
  totalMessageCount?: number;
}

export function CloneProjectDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
  isCloning,
  fromMessageIndex,
  totalMessageCount,
}: CloneProjectDialogProps) {
  const defaultName = `Project #${~~(Math.random() * 100000)}`;
  const [name, setName] = useState(defaultName);
  const [includeSourceCode, setIncludeSourceCode] = useState(true);
  const [includeMessages, setIncludeMessages] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeRules, setIncludeRules] = useState(true);

  const handleConfirm = () => {
    onConfirm({ name, includeSourceCode, includeMessages, includeSkills, includeRules, fromMessageIndex });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName(`Project #${~~(Math.random() * 100000)}`);
      setIncludeSourceCode(true);
      setIncludeMessages(true);
      setIncludeSkills(true);
      setIncludeRules(true);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-neutral-100">Clone project</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Select what to include in the cloned project from{" "}
            <span className="font-medium text-neutral-200">{projectName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="clone-name" className="text-sm text-neutral-300">
              Project name
            </label>
            <input
              id="clone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCloning}
              className="h-8 px-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-100 placeholder:text-neutral-500 outline-none focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
            />
          </div>

          {[
            { label: "Source code", checked: includeSourceCode, onChange: setIncludeSourceCode },
            { label: "Messages", checked: includeMessages, onChange: setIncludeMessages },
            { label: "Skills", checked: includeSkills, onChange: setIncludeSkills },
            { label: "Rules", checked: includeRules, onChange: setIncludeRules },
          ].map(({ label, checked, onChange }) => (
            <div key={label}>
              <label
                className="flex items-center gap-2.5 text-sm text-neutral-300 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={isCloning}
                  className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-blue-500"
                />
                {label}
              </label>
              {label === "Messages" && fromMessageIndex != null && totalMessageCount != null && checked && (
                <p className="ml-6.5 mt-0.5 text-xs text-neutral-500">
                  From message #{fromMessageIndex + 1} of {totalMessageCount}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCloning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isCloning}
          >
            {isCloning ? "Cloning..." : "Clone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
