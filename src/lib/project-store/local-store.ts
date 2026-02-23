import type { ProjectStore } from "./types";
import {
  localCreateProject,
  localGetProjects,
  localGetProject,
  localDeleteProject,
  localRenameProject,
  localCloneProject,
  localSaveProjectData,
  localSaveProjectMessages,
  localSaveProjectRules,
  localGetProjectRules,
  localSaveProjectSkills,
  localGetProjectSkills,
  localCreateCheckpoint,
  localGetCheckpoints,
  localDeleteCheckpoint,
  localRestoreCheckpoint,
} from "@/lib/local-db";

export function createLocalStore(): ProjectStore {
  return {
    isLocal: true,
    getProjects: localGetProjects,
    getProject: localGetProject,
    createProject: localCreateProject,
    deleteProject: localDeleteProject,
    renameProject: localRenameProject,
    cloneProject: localCloneProject,
    saveProjectData: localSaveProjectData,
    saveMessages: localSaveProjectMessages,
    saveProjectRules: localSaveProjectRules,
    getProjectRules: localGetProjectRules,
    saveProjectSkills: localSaveProjectSkills,
    getProjectSkills: localGetProjectSkills,
    getCheckpoints: localGetCheckpoints,
    createCheckpoint: localCreateCheckpoint,
    async createAutoCheckpoint(projectId) {
      return localCreateCheckpoint(projectId, `Auto: ${new Date().toLocaleString()}`, "auto");
    },
    deleteCheckpoint: localDeleteCheckpoint,
    async restoreCheckpoint(checkpointId) {
      return localRestoreCheckpoint(checkpointId);
    },
    async togglePublish() {
      // Publishing is not available for local/guest users
      return false;
    },
  };
}
