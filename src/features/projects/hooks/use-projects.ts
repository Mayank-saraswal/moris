"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ---- API helpers ----
async function fetchAPI<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

async function mutateAPI<T>(url: string, data: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// ---- Types ----
export interface Project {
    id: string;
    name: string;
    language: string;
    framework: string | null;
    settings: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

// ---- Hooks ----
export const useProject = (projectId: string | null) => {
    return useQuery({
        queryKey: ["project", projectId],
        queryFn: () => fetchAPI<Project>(`/api/projects/${projectId}`),
        enabled: !!projectId,
    });
};

export const useProjects = () => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: () => fetchAPI<Project[]>("/api/projects"),
    });
};

export const useProjectPartial = (limit: number) => {
    return useQuery({
        queryKey: ["projects", "partial", limit],
        queryFn: () => fetchAPI<Project[]>(`/api/projects?limit=${limit}`),
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string }) =>
            mutateAPI<Project>("/api/projects", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
};

export const useRenameProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { id: string; name: string }) =>
            mutateAPI<Project>(`/api/projects/${data.id}/rename`, {
                name: data.name,
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
};

export const useUpdateProjectSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { id: string; settings: Record<string, unknown> }) =>
            mutateAPI(`/api/projects/${data.id}/settings`, {
                settings: data.settings,
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
        },
    });
};
