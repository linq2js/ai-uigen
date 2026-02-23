import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * POST /api/sync/push
 *
 * Upsert full project data from the client (IndexedDB) into PostgreSQL.
 * Creates a new server-side project if one doesn't exist yet for this local ID,
 * or updates the existing one.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    rules?: string;
    skills?: any[];
    messageCount?: number;
    totalInputTokens?: number;
    totalOutputTokens?: number;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    id,
    name,
    messages,
    data,
    rules = "",
    skills = [],
    messageCount = 0,
    totalInputTokens = 0,
    totalOutputTokens = 0,
  } = body;

  if (!id || !name) {
    return Response.json({ error: "Missing id or name" }, { status: 400 });
  }

  const project = await prisma.project.upsert({
    where: { id },
    create: {
      id,
      name,
      userId: session.userId,
      messages: JSON.stringify(messages),
      data: JSON.stringify(data),
      rules,
      skills: JSON.stringify(skills),
      messageCount,
      totalInputTokens,
      totalOutputTokens,
    },
    update: {
      name,
      messages: JSON.stringify(messages),
      data: JSON.stringify(data),
      rules,
      skills: JSON.stringify(skills),
      messageCount,
      totalInputTokens,
      totalOutputTokens,
    },
  });

  return Response.json({
    id: project.id,
    updatedAt: project.updatedAt.toISOString(),
  });
}
