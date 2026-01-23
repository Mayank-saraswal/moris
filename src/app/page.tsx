"use client";

import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const projects = useQuery(api.projects.get);
  const createProject = useMutation(api.projects.create);
  return (
    <div className="flex flex-col gap-2 p-4">
      <Button onClick={() => createProject({ name: "New Project" })}>Create Project</Button>
      {projects?.map((project) => (
        <div key={project._id} className="border rounded flex flex-col p-2">
          <h1>{project.name}</h1>
          <p>Owner Id : {project.ownerId} </p>
        </div>
      ))}
    </div>
  );
}
