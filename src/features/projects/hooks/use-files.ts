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

async function deleteAPI(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

// ---- Types ----
export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  language: string | null;
  size: number | null;
  blobPath: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Hooks ----
export const useFiles = (projectId: string | null) => {
  return useQuery({
    queryKey: ["files", projectId],
    queryFn: () => fetchAPI<FileItem[]>(`/api/projects/${projectId}/files`),
    enabled: !!projectId,
  });
};

export const useFile = (fileId: string | null) => {
  return useQuery({
    queryKey: ["file", fileId],
    queryFn: () => fetchAPI<FileItem>(`/api/files/${fileId}`),
    enabled: !!fileId,
  });
};

export const useFileContent = (projectId: string | null, fileId: string | null) => {
  return useQuery({
    queryKey: ["file-content", fileId],
    queryFn: () => fetchAPI<{ content: string }>(`/api/files/${fileId}/content`),
    enabled: !!projectId && !!fileId,
    staleTime: 5 * 60 * 1000, // 5 min — content doesn't change often client-side
  });
};

export const useCreateFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      name: string;
      content: string;
      parentPath?: string;
    }) => mutateAPI<FileItem>(`/api/projects/${data.projectId}/files`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["files", variables.projectId],
      });
    },
  });
};

export const useUpdateFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { fileId: string; content: string }) =>
      mutateAPI(`/api/files/${data.fileId}`, { content: data.content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["file-content", variables.fileId],
      });
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      name: string;
      parentPath?: string;
    }) =>
      mutateAPI<FileItem>(`/api/projects/${data.projectId}/files`, {
        ...data,
        type: "folder",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["files", variables.projectId],
      });
    },
  });
};

export const useRenameFile = ({ projectId }: { projectId: string }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; newName: string }) =>
      mutateAPI(`/api/files/${data.id}/rename`, { newName: data.newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
    },
  });
};

export const useDeleteFile = ({ projectId }: { projectId: string }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string }) => deleteAPI(`/api/files/${data.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
    },
  });
};

export const useFolderContents = ({
  projectId,
  parentPath,
  enabled = true,
}: {
  projectId: string;
  parentPath?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ["folder-contents", projectId, parentPath],
    queryFn: () => {
      const params = new URLSearchParams();
      if (parentPath) params.set("parentPath", parentPath);
      return fetchAPI<FileItem[]>(
        `/api/projects/${projectId}/files?${params.toString()}`
      );
    },
    enabled,
  });
};

/**
 * Derive breadcrumb path segments from a file's path.
 * Returns an array of { id, name } objects representing each path segment.
 */
export const useFilePath = (fileId: string | null) => {
  const { data: file } = useFile(fileId);

  if (!file) return undefined;

  const parts = file.path.split("/");
  return parts.map((name, index) => ({
    id: `${fileId}-segment-${index}`,
    name,
  }));
};
