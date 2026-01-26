import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useProjects = () => {
    return useQuery(api.projects.get)
}

export const useProjectPartial = (limit:number) => {
    return useQuery(api.projects.getPartial, {
         limit 
        
        })
}

export const useCreateProject = () => {
    return useMutation(api.projects.create)
};

