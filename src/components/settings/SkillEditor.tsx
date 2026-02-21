"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/contexts/chat-context";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Skill } from "@/lib/types/skill";

interface SkillEditorProps {
  projectId?: string;
}

interface SkillFormData {
  name: string;
  description: string;
  content: string;
}

const EMPTY_FORM: SkillFormData = { name: "", description: "", content: "" };

export function SkillEditor({ projectId }: SkillEditorProps) {
  const {
    globalSkills,
    addGlobalSkill,
    updateGlobalSkill,
    deleteGlobalSkill,
    toggleGlobalSkill,
    projectSkills,
    addProjectSkill,
    updateProjectSkill,
    deleteProjectSkill,
    toggleProjectSkill,
  } = useChat();

  const [formMode, setFormMode] = useState<
    | { type: "hidden" }
    | { type: "add"; scope: "global" | "project" }
    | { type: "edit"; scope: "global" | "project"; id: string }
  >({ type: "hidden" });
  const [form, setForm] = useState<SkillFormData>(EMPTY_FORM);

  const openAdd = (scope: "global" | "project") => {
    setForm(EMPTY_FORM);
    setFormMode({ type: "add", scope });
  };

  const openEdit = (skill: Skill, scope: "global" | "project") => {
    setForm({
      name: skill.name,
      description: skill.description,
      content: skill.content,
    });
    setFormMode({ type: "edit", scope, id: skill.id });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.content.trim()) return;

    const skillData = {
      name: form.name.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
      enabled: true,
    };

    if (formMode.type === "add") {
      if (formMode.scope === "global") {
        addGlobalSkill(skillData);
      } else {
        addProjectSkill(skillData);
      }
    } else if (formMode.type === "edit") {
      const { id, scope } = formMode;
      if (scope === "global") {
        updateGlobalSkill(id, skillData);
      } else {
        updateProjectSkill(id, skillData);
      }
    }

    setFormMode({ type: "hidden" });
    setForm(EMPTY_FORM);
  };

  const handleCancel = () => {
    setFormMode({ type: "hidden" });
    setForm(EMPTY_FORM);
  };

  const isFormVisible = formMode.type !== "hidden";

  return (
    <div className="space-y-4">
      {/* Global Skills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-neutral-200">
            Global Skills
          </h4>
          {!isFormVisible && (
            <Button
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => openAdd("global")}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          )}
        </div>
        {globalSkills.length === 0 && !isFormVisible && (
          <p className="text-xs text-neutral-500 py-2">
            No global skills yet. Skills provide specialized knowledge the AI loads on demand.
          </p>
        )}
        <SkillList
          skills={globalSkills}
          scope="global"
          onToggle={toggleGlobalSkill}
          onEdit={(skill) => openEdit(skill, "global")}
          onDelete={deleteGlobalSkill}
          disabled={isFormVisible}
        />
      </div>

      {/* Project Skills */}
      <div className="border-t border-neutral-800" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-neutral-200">
            Project Skills
          </h4>
          {!isFormVisible && projectId && (
            <Button
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => openAdd("project")}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          )}
        </div>
        {!projectId ? (
          <div className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-4 text-center">
            <p className="text-xs text-neutral-500">
              Sign in and open a project to add project-specific skills.
            </p>
          </div>
        ) : projectSkills.length === 0 && !isFormVisible ? (
          <p className="text-xs text-neutral-500 py-2">
            No project skills yet.
          </p>
        ) : (
          <SkillList
            skills={projectSkills}
            scope="project"
            onToggle={toggleProjectSkill}
            onEdit={(skill) => openEdit(skill, "project")}
            onDelete={deleteProjectSkill}
            disabled={isFormVisible}
          />
        )}
      </div>

      {/* Skill form */}
      {isFormVisible && (
        <>
          <div className="border-t border-neutral-800" />
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-neutral-200">
              {formMode.type === "add" ? "New" : "Edit"}{" "}
              {"scope" in formMode && formMode.scope === "global"
                ? "Global"
                : "Project"}{" "}
              Skill
            </h4>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Skill name (e.g. Form Builder)"
              className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
            />
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Short description shown to the AI (1-2 sentences)"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none"
            />
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              placeholder="Full skill instructions loaded when the AI decides this skill is relevant..."
              rows={8}
              className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none font-mono"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="h-8"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="h-8"
                onClick={handleSave}
                disabled={!form.name.trim() || !form.content.trim()}
              >
                {formMode.type === "add" ? "Add Skill" : "Save Changes"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SkillList({
  skills,
  scope,
  onToggle,
  onEdit,
  onDelete,
  disabled,
}: {
  skills: Skill[];
  scope: "global" | "project";
  onToggle: (id: string) => void;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {skills.map((skill) => (
        <div
          key={skill.id}
          className="flex items-start gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 group"
        >
          <button
            onClick={() => onToggle(skill.id)}
            disabled={disabled}
            className={`mt-0.5 h-4 w-7 rounded-full transition-colors shrink-0 relative ${
              skill.enabled
                ? "bg-blue-600"
                : "bg-neutral-700"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title={skill.enabled ? "Disable skill" : "Enable skill"}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                skill.enabled ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium truncate ${
                  skill.enabled ? "text-neutral-200" : "text-neutral-500"
                }`}
              >
                {skill.name}
              </span>
            </div>
            {skill.description && (
              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                {skill.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(skill)}
              disabled={disabled}
              className="h-6 w-6 flex items-center justify-center rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-50"
              title="Edit skill"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(skill.id)}
              disabled={disabled}
              className="h-6 w-6 flex items-center justify-center rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-700 transition-colors disabled:opacity-50"
              title="Delete skill"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
