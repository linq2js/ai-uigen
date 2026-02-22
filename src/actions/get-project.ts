"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getProject(projectId: string) {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      userId: session.userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const dataSize =
    Buffer.byteLength(project.messages, "utf8") +
    Buffer.byteLength(project.data, "utf8") +
    Buffer.byteLength(project.skills, "utf8") +
    Buffer.byteLength(project.rules, "utf8");

  return {
    id: project.id,
    name: project.name,
    messages: JSON.parse(project.messages),
    data: JSON.parse(project.data),
    published: project.published,
    messageCount: project.messageCount,
    totalInputTokens: project.totalInputTokens,
    totalOutputTokens: project.totalOutputTokens,
    dataSize,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}