import type { Skill } from "@/lib/types/skill";

export interface ProjectSummary {
  id: string;
  name: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDetail {
  id: string;
  name: string;
  messages: any[];
  data: any;
  published: boolean;
  messageCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  dataSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  messages: any[];
  data: Record<string, any>;
}

export interface CloneProjectInput {
  sourceProjectId: string;
  name?: string;
  includeSourceCode?: boolean;
  includeMessages?: boolean;
  includeSkills?: boolean;
  includeRules?: boolean;
  fromMessageIndex?: number;
}

export type CheckpointType = "manual" | "auto";

export interface CheckpointSummary {
  id: string;
  name: string;
  type: CheckpointType;
  createdAt: Date;
}

export interface ProjectStore {
  isLocal: boolean;
  getProjects(): Promise<ProjectSummary[]>;
  getProject(id: string): Promise<ProjectDetail | null>;
  createProject(input: CreateProjectInput): Promise<{ id: string }>;
  deleteProject(id: string): Promise<void>;
  renameProject(id: string, name: string): Promise<string>;
  cloneProject(input: CloneProjectInput): Promise<{ id: string }>;
  saveProjectData(id: string, data: string): Promise<void>;
  saveMessages(id: string, messages: any[], inputTokens: number, outputTokens: number): Promise<void>;
  saveProjectRules(id: string, rules: string): Promise<void>;
  getProjectRules(id: string): Promise<string>;
  saveProjectSkills(id: string, skills: Skill[]): Promise<void>;
  getProjectSkills(id: string): Promise<Skill[]>;
  getCheckpoints(projectId: string): Promise<CheckpointSummary[]>;
  createCheckpoint(projectId: string, name: string): Promise<CheckpointSummary>;
  createAutoCheckpoint(projectId: string): Promise<CheckpointSummary>;
  deleteCheckpoint(checkpointId: string): Promise<void>;
  restoreCheckpoint(checkpointId: string): Promise<{ projectId: string }>;
  togglePublish(id: string): Promise<boolean>;
}
