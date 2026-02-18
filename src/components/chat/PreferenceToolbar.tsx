"use client";

import { useState } from "react";
import { ChevronDown, Check, Accessibility } from "lucide-react";
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
              ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
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
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-neutral-700 hover:bg-neutral-100"
            )}
          >
            <Check
              className={cn(
                "w-3.5 h-3.5 flex-shrink-0",
                option === currentValue
                  ? "opacity-100 text-blue-600"
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
}: PreferenceToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
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
            ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
        )}
      >
        <Accessibility className="w-3.5 h-3.5" />
        <span>A11y</span>
      </button>
    </div>
  );
}
