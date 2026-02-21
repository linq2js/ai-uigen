"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useChat } from "@/lib/contexts/chat-context";

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  const { globalRules, projectRules, allEnabledSkills } = useChat();

  const activeCount =
    (globalRules.trim() ? 1 : 0) +
    (projectRules.trim() ? 1 : 0) +
    allEnabledSkills.length;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 relative"
      onClick={onClick}
      title="Settings"
    >
      <Settings className="h-4 w-4" />
      {activeCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white px-1 leading-none">
          {activeCount}
        </span>
      )}
    </Button>
  );
}
