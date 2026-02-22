"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      title="Settings"
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
}
