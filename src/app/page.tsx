"use client";

import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProjectView } from "@/features/projects/components/project-view";

const Home = () => {
  return (
    <ProjectView />
  );
} 

export default Home;
