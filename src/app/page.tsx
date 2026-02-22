import { getUser } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { redirect } from "next/navigation";
import { GuestProjectLoader } from "./guest-project-loader";

interface HomeProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const user = await getUser();

  // If user is authenticated, redirect to their most recent project
  if (user) {
    const projects = await getProjects();

    if (projects.length > 0) {
      redirect(`/${projects[0].id}`);
    }

    // If no projects exist, create a new one
    const newProject = await createProject({
      name: `Project #${~~(Math.random() * 100000)}`,
      messages: [],
      data: {},
    });

    redirect(`/${newProject.id}`);
  }

  // For anonymous users, delegate to the client-side guest loader
  const params = await searchParams;
  const localProjectId = params.project?.startsWith("local_") ? params.project : undefined;

  return <GuestProjectLoader localProjectId={localProjectId} />;
}
