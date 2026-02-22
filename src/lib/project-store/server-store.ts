import type { ProjectStore } from "./types";
import { getProjects } from "@/actions/get-projects";
import { getProject } from "@/actions/get-project";
import { createProject } from "@/actions/create-project";
import { deleteProject } from "@/actions/delete-project";
import { renameProject } from "@/actions/rename-project";
import { cloneProject } from "@/actions/clone-project";
import { saveProjectData } from "@/actions/save-project-data";
import { saveProjectRules } from "@/actions/save-project-rules";
import { getProjectRules } from "@/actions/get-project-rules";
import { saveProjectSkills } from "@/actions/save-project-skills";
import { getProjectSkills } from "@/actions/get-project-skills";
import { getCheckpoints } from "@/actions/get-checkpoints";
import { createCheckpoint } from "@/actions/create-checkpoint";
import { deleteCheckpoint } from "@/actions/delete-checkpoint";
import { restoreCheckpoint } from "@/actions/restore-checkpoint";
import { togglePublish } from "@/actions/toggle-publish";

export function createServerStore(): ProjectStore {
  return {
    isLocal: false,
    getProjects,
    getProject,
    createProject,
    async deleteProject(id) {
      await deleteProject(id);
    },
    renameProject,
    cloneProject,
    saveProjectData,
    async saveMessages() {
      // Messages are saved by the chat API route for authenticated users
    },
    saveProjectRules,
    getProjectRules,
    saveProjectSkills,
    getProjectSkills,
    getCheckpoints,
    createCheckpoint,
    async deleteCheckpoint(checkpointId) {
      await deleteCheckpoint(checkpointId);
    },
    async restoreCheckpoint(checkpointId) {
      await restoreCheckpoint(checkpointId);
    },
    togglePublish,
  };
}
