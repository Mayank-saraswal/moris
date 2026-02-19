"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

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
export interface Conversation {
    id: string;
    projectId: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    status: string;
    model: string | null;
    thinking: string | null;
    createdAt: string;
}

// ---- Hooks ----
export const useConversation = (id: string | null) => {
    return useQuery({
        queryKey: ["conversation", id],
        queryFn: () => fetchAPI<Conversation>(`/api/conversations/${id}`),
        enabled: !!id,
    });
};

/**
 * Real-time messages hook using Supabase Realtime
 * Messages are fetched initially via API, then updated in real-time via WebSocket
 */
export const useMessages = (conversationId: string | null) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["messages", conversationId],
        queryFn: () =>
            fetchAPI<Message[]>(`/api/conversations/${conversationId}/messages`),
        enabled: !!conversationId,
        refetchInterval: false,
    });

    // Subscribe to real-time updates for messages
    useEffect(() => {
        if (!conversationId) return;

        let mounted = true;
        const supabase = getSupabaseBrowserClient();

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    if (!mounted) return;

                    // Invalidate and refetch messages when changes occur
                    queryClient.invalidateQueries({
                        queryKey: ["messages", conversationId],
                    });
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [conversationId, queryClient]);

    return query;
};

export const useConversations = (projectId: string) => {
    return useQuery({
        queryKey: ["conversations", projectId],
        queryFn: () =>
            fetchAPI<Conversation[]>(
                `/api/projects/${projectId}/conversations`
            ),
    });
};

export const useCreateConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { projectId: string; title?: string }) =>
            mutateAPI<Conversation>("/api/conversations", data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["conversations", variables.projectId],
            });
        },
    });
};
