"use client"

import { formatDistanceToNow } from "date-fns";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useConversations } from "../hooks/use-conversations";


interface PastConversationsDialogProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (conversationId: string) => void;
}

export const PastConversationsDialog = ({
    projectId,
    open,
    onOpenChange,
    onSelect,
}: PastConversationsDialogProps) => {
    const conversations = useConversations(projectId);
    const handleSelect = (conversationId: string) => {
        onSelect?.(conversationId);
        onOpenChange(false);
    };
    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}
            title="Past Conversations"
            description=" Search and select a past conversation"
        >
            <CommandInput placeholder="Search conversations..." />
            <CommandList>
                <CommandEmpty>No conversations found.</CommandEmpty>
                <CommandGroup heading="Conversations">
                    {conversations.data?.map((conversation) => (
                        <CommandItem
                            key={conversation.id}
                            value={`${conversation.title}-${conversation.id}`}
                            onSelect={() => handleSelect(conversation.id)}
                        >
                            <div className="flex flex-col gap-0.5">
                                <span>{conversation.title}</span>
                                <span
                                    className="text-sm text-muted-foreground"
                                >{formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })
                                    }</span>
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
};
