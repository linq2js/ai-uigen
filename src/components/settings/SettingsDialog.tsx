"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/contexts/chat-context";
import { SkillEditor } from "./SkillEditor";
import { deleteAllProjects } from "@/actions/delete-all-projects";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    apiKey,
    setApiKey,
    clearApiKey,
    globalRules,
    setGlobalRules,
  } = useChat();

  const [keyInput, setKeyInput] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  const [globalRulesInput, setGlobalRulesInput] = useState("");
  const [globalRulesSaved, setGlobalRulesSaved] = useState(false);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setKeyInput(apiKey);
      setKeySaved(false);
      setGlobalRulesInput(globalRules);
      setGlobalRulesSaved(false);
    }
    setShowClearConfirm(false);
    onOpenChange(isOpen);
  };

  const handleSaveKey = () => {
    setApiKey(keyInput.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleClearKey = () => {
    clearApiKey();
    setKeyInput("");
    setKeySaved(false);
  };

  const handleClearAllProjects = async () => {
    setIsClearing(true);
    try {
      const result = await deleteAllProjects();
      toast.success(`Deleted ${result.count} project${result.count === 1 ? "" : "s"}`);
      setShowClearConfirm(false);
      onOpenChange(false);
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete projects");
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveGlobalRules = () => {
    setGlobalRules(globalRulesInput);
    setGlobalRulesSaved(true);
    setTimeout(() => setGlobalRulesSaved(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure API key, global rules, global skills, and manage data.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="api-key" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="api-key">API Key</TabsTrigger>
            <TabsTrigger value="rules">Global Rules</TabsTrigger>
            <TabsTrigger value="skills">Global Skills</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="api-key" className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="api-key"
                  className="text-sm font-medium text-neutral-200"
                >
                  Claude API Key
                </label>
                <span
                  className={`h-2 w-2 rounded-full ${apiKey ? "bg-green-500" : "bg-neutral-600"}`}
                  title={apiKey ? "API key is set" : "No API key"}
                />
              </div>
              <input
                id="api-key"
                type="password"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setKeySaved(false);
                }}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              />
              <p className="text-xs text-neutral-500">
                Your key is stored in this browser only and sent directly to the
                Anthropic API. It is never saved on our servers.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="h-8"
              >
                {keySaved ? "Saved!" : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={handleClearKey}
                disabled={!apiKey}
                className="h-8"
              >
                Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-200">
                Global Rules
              </label>
              <span className="text-xs text-neutral-500">
                {globalRulesInput.length} chars
              </span>
            </div>
            <textarea
              value={globalRulesInput}
              onChange={(e) => {
                setGlobalRulesInput(e.target.value);
                setGlobalRulesSaved(false);
              }}
              placeholder={"Apply to all projects. Examples:\n- Always use arrow functions\n- Prefer dark color schemes\n- Add comments to complex logic"}
              rows={8}
              className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none font-mono"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Injected into every prompt across all projects.
              </p>
              <Button
                onClick={handleSaveGlobalRules}
                className="h-7 text-xs"
              >
                {globalRulesSaved ? "Saved!" : "Save"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="mt-4">
            <SkillEditor scope="global" />
          </TabsContent>

          <TabsContent value="data" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-200">
                Clear All Project Data
              </h3>
              <p className="text-xs text-neutral-500">
                Permanently delete all your projects, including their messages,
                checkpoints, and generated code. This action cannot be undone.
              </p>
            </div>
            {!showClearConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowClearConfirm(true)}
                className="h-8 bg-red-600 hover:bg-red-700 text-white"
              >
                Clear All Projects
              </Button>
            ) : (
              <div className="rounded-md border border-red-800 bg-red-950/50 p-4 space-y-3">
                <p className="text-sm text-red-300">
                  Are you sure? This will permanently delete all your projects
                  and cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleClearAllProjects}
                    disabled={isClearing}
                    className="h-8 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isClearing ? "Deleting..." : "Yes, delete everything"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowClearConfirm(false)}
                    disabled={isClearing}
                    className="h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
