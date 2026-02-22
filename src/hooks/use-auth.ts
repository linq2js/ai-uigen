"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePostSignIn = async () => {
    // Find the user's most recent project
    const projects = await getProjects();

    if (projects.length > 0) {
      router.push(`/${projects[0].id}`);
      return;
    }

    // If no projects exist, create a new one
    const newProject = await createProject({
      name: `Project #${~~(Math.random() * 100000)}`,
      messages: [],
      data: {},
    });

    router.push(`/${newProject.id}`);
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signInAction(email, password);

      if (result.success) {
        await handlePostSignIn();
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signUpAction(email, password);

      if (result.success) {
        await handlePostSignIn();
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    isLoading,
  };
}
