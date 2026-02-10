import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { skip } from "node:test";


export const useCreateFile = ()=>{
    return useMutation(api.files.createFile);
    
};


export const useCreateFolder = ()=>{
    return useMutation(api.files.createFolder);
    
};


export const useFolderContents = ({
    projectId,
    parentId,
    enabled = true,
}:{
    projectId:Id<"projects">;
    parentId?:Id<"files">;
    enabled?:boolean;
})=>{
    return useQuery(
        api.files.getFolderContents,
        enabled ? {projectId , parentId} : "skip",
        
    )
}