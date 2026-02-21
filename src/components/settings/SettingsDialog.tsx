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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export function SettingsDialog({ open, onOpenChange, projectId }: SettingsDialogProps) {
  const {
    apiKey,
    setApiKey,
    clearApiKey,
    globalRules,
    setGlobalRules,
    projectRules,
    setProjectRules,
  } = useChat();

  const [keyInput, setKeyInput] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  const [globalRulesInput, setGlobalRulesInput] = useState("");
  const [globalRulesSaved, setGlobalRulesSaved] = useState(false);

  const [projectRulesInput, setProjectRulesInput] = useState("");
  const [projectRulesSaved, setProjectRulesSaved] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setKeyInput(apiKey);
      setKeySaved(false);
      setGlobalRulesInput(globalRules);
      setGlobalRulesSaved(false);
      setProjectRulesInput(projectRules);
      setProjectRulesSaved(false);
    }
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

  const handleSaveGlobalRules = () => {
    setGlobalRules(globalRulesInput);
    setGlobalRulesSaved(true);
    setTimeout(() => setGlobalRulesSaved(false), 2000);
  };

  const handleSaveProjectRules = async () => {
    await setProjectRules(projectRulesInput);
    setProjectRulesSaved(true);
    setTimeout(() => setProjectRulesSaved(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure API key, rules, and skills.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="api-key" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="api-key">API Key</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
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

          <TabsContent value="rules" className="mt-4 space-y-6">
            <div className="space-y-2">
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
                rows={6}
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
            </div>

            <div className="border-t border-neutral-800" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-200">
                  Project Rules
                </label>
                {projectId && (
                  <span className="text-xs text-neutral-500">
                    {projectRulesInput.length} chars
                  </span>
                )}
              </div>
              {projectId ? (
                <>
                  <textarea
                    value={projectRulesInput}
                    onChange={(e) => {
                      setProjectRulesInput(e.target.value);
                      setProjectRulesSaved(false);
                    }}
                    placeholder={"Apply to this project only. Examples:\n- This is a dashboard app, use chart.js\n- Use a purple/teal color palette\n- All buttons should have rounded-full"}
                    rows={6}
                    className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none font-mono"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      Override global rules when they conflict. Stored per project.
                    </p>
                    <Button
                      onClick={handleSaveProjectRules}
                      className="h-7 text-xs"
                    >
                      {projectRulesSaved ? "Saved!" : "Save"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-6 text-center">
                  <p className="text-sm text-neutral-500">
                    Sign in and open a project to set project-specific rules.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="skills" className="mt-4">
            <SkillEditor projectId={projectId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
