"use client";

import { useState } from "react";
import { ChevronDown, Check, Accessibility, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  GenerationPreferences,
  PREFERENCE_CATEGORIES,
  PreferenceCategory,
} from "@/lib/types/preferences";
import { cn } from "@/lib/utils";

interface PreferenceToolbarProps {
  preferences: GenerationPreferences;
  setPreference: <K extends keyof GenerationPreferences>(
    key: K,
    value: GenerationPreferences[K]
  ) => void;
  isDefault: <K extends keyof GenerationPreferences>(key: K) => boolean;
  onReset?: () => void;
}

function CategoryChip({
  category,
  currentValue,
  modified,
  setPreference,
}: {
  category: PreferenceCategory;
  currentValue: string;
  modified: boolean;
  setPreference: PreferenceToolbarProps["setPreference"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
            modified
              ? "border-blue-500/40 bg-blue-500/15 text-blue-400 hover:bg-blue-500/20"
              : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          )}
        >
          <span className="uppercase tracking-wider text-[10px] opacity-60">
            {category.label}
          </span>
          <span>{currentValue}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-52 p-1"
        sideOffset={6}
      >
        {category.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPreference(
                category.key,
                option as GenerationPreferences[typeof category.key]
              );
              setOpen(false);
            }}
            className={cn(
              "flex items-center w-full gap-2 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer",
              option === currentValue
                ? "bg-blue-500/15 text-blue-400 font-medium"
                : "text-neutral-300 hover:bg-neutral-700"
            )}
          >
            <Check
              className={cn(
                "w-3.5 h-3.5 flex-shrink-0",
                option === currentValue
                  ? "opacity-100 text-blue-400"
                  : "opacity-0"
              )}
            />
            {option}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function PreferenceToolbar({
  preferences,
  setPreference,
  isDefault,
  onReset,
}: PreferenceToolbarProps) {
  const hasModified = PREFERENCE_CATEGORIES.some((c) => !isDefault(c.key)) || preferences.accessibility;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-1.5 pt-2 px-3 bg-neutral-900 rounded-t-xl">
      {PREFERENCE_CATEGORIES.map((category) => {
        const currentValue = preferences[category.key] as string;
        const modified = !isDefault(category.key);

        return (
          <CategoryChip
            key={category.key}
            category={category}
            currentValue={currentValue}
            modified={modified}
            setPreference={setPreference}
          />
        );
      })}

      {/* A11y toggle */}
      <button
        type="button"
        onClick={() => setPreference("accessibility", !preferences.accessibility)}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
          preferences.accessibility
            ? "border-green-500/40 bg-green-500/15 text-green-400 hover:bg-green-500/20"
            : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
        )}
      >
        <Accessibility className="w-3.5 h-3.5" />
        <span>A11y</span>
      </button>

      {/* Reset button */}
      {hasModified && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50 transition-colors cursor-pointer"
          title="Reset all to Auto"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
