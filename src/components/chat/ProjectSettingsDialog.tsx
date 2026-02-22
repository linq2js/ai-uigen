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
import { SkillEditor } from "@/components/settings/SkillEditor";

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSettingsDialog({
  open,
  onOpenChange,
}: ProjectSettingsDialogProps) {
  const { projectId, projectRules, setProjectRules } = useChat();

  const [rulesInput, setRulesInput] = useState("");
  const [rulesSaved, setRulesSaved] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRulesInput(projectRules);
      setRulesSaved(false);
    }
    onOpenChange(isOpen);
  };

  const handleSaveRules = async () => {
    await setProjectRules(rulesInput);
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Configure rules and skills for this project.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="rules" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-200">
                Project Rules
              </label>
              <span className="text-xs text-neutral-500">
                {rulesInput.length} chars
              </span>
            </div>
            <textarea
              value={rulesInput}
              onChange={(e) => {
                setRulesInput(e.target.value);
                setRulesSaved(false);
              }}
              placeholder={
                "Apply to this project only. Examples:\n- This is a dashboard app, use chart.js\n- Use a purple/teal color palette\n- All buttons should have rounded-full"
              }
              rows={8}
              className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none font-mono"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Override global rules when they conflict. Stored per project.
              </p>
              <Button onClick={handleSaveRules} className="h-7 text-xs">
                {rulesSaved ? "Saved!" : "Save"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="mt-4">
            <SkillEditor projectId={projectId} scope="project" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
