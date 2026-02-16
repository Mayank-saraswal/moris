import { Id } from "../../../../convex/_generated/dataModel";
import ky from "ky";
import { useState } from "react";
import { CopyIcon, HistoryIcon, PlusIcon, LoaderIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import {
    useConversation,
    useConversations,
    useCreateConversation,
    useMessages
} from "@/features/conversations/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton
} from "@/components/ai-elements/conversation"

import {
    Message,
    MessageContent,
    MessageResponse,
    MessageActions,
    MessageAction
} from "@/components/ai-elements/message"

import {
    PromptInput,
    PromptInputBody,
    PromptInputFooter,
    PromptInputSubmit,
    PromptInputTools,
    PromptInputTextarea,
    type PromptInputMessage
} from "@/components/ai-elements/prompt-input"
import { DEFAULT_CONVERSATION_TITLE } from "../../../../convex/constatnts";



interface ConversationSidebarProps {
    projectId: Id<"projects">;
}

export const ConversationSidebar = ({ projectId }: ConversationSidebarProps) => {
    const createConversation = useCreateConversation();
    const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
    const conversations = useConversations(projectId);
    const activeConversationId = selectedConversationId ?? conversations?.[0]?._id ?? null; 
    const activeConversation = useConversation(activeConversationId);
    const conversationMessages = useMessages(activeConversationId);
    const isProcessing = conversationMessages?.some((message) => message.status === "processing");
    const [input, setInput] = useState("");
    const handleCreateConversation = async () => {
        try {
            const newConversationId = await createConversation({ projectId, title: DEFAULT_CONVERSATION_TITLE });
            setSelectedConversationId(newConversationId);
            return newConversationId;
        } catch (error) {

            toast.error("Failed to create conversation");
            return null;
        }
    };

    const handleSubmit = async (message: PromptInputMessage) => {
        if (isProcessing && !message.text.trim()) {
            //todo handle cancel
            setInput("");
            return;
        }
        let conversationId = activeConversationId;
        if (!conversationId) {
            conversationId = await handleCreateConversation();
              if (!conversationId) {
            return;
            }
        }
        //trigger inggest function
        try {
            await ky.post("/api/messages", {
                json: {
                    conversationId,
                    message: message.text,
                },
            });
        } catch (error) {
            toast.error("Failed to send message");
        }
        setInput("");
       
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="h-8.75 flex items-center justify-between border-b">
                <div className="text-sm truncate pl-3">
                    {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
                </div>
                <div className="flex-items-center px- gap-1">
                    <Button
                        size="icon-xs"
                        variant='highlight'
                    >
                        <HistoryIcon className="size-3.5" />

                    </Button>

                    <Button
                        size="icon-xs"
                        variant='highlight'
                        onClick={handleCreateConversation}
                    >
                        <PlusIcon className="size-3.5" />

                    </Button>

                </div>

            </div>
            <Conversation className="flex-1 ">
                <ConversationContent>
                    <p className="text-muted-foreground text-sm">
                        {conversationMessages?.map((message , messageIndex) => (
                            <Message key={message._id}
                            from={message.role}
                            >
                                <MessageContent>
                                    {message.status === "processing" ? (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <LoaderIcon className="size-3.5 animate-spin" />
                                            <p>Thinking...</p>
                                        </div>
                                    ) : (
                                        <MessageResponse>
                                            {message.content}
                                        </MessageResponse>
                                    )}
                                </MessageContent>
                                {message.role ==="assistant" &&
                                message.status === "completed" &&
                                messageIndex === (conversationMessages?.length ?? 0) - 1 && (
                                    <MessageActions>
                                        <MessageAction
                                        onClick={() => {
                                            navigator.clipboard.writeText(message.content);
                                            toast.success("Message copied to clipboard");
                                        }}
                                        label="Copy"
                                        >
                                            <CopyIcon className="size-3.5" />
                                        </MessageAction>
                                    </MessageActions>
                                )}
                            </Message>
                        ))}
                    </p>
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>
            <div className="p-3">
                <PromptInput
                    onSubmit={handleSubmit}
                    className="mt-2 rounded-full! "

                >
                    <PromptInputBody>
                        <PromptInputTextarea
                            placeholder="Ask anything..."
                            onChange={(e) => setInput(e.target.value)}
                            value={input}
                            disabled={isProcessing}
                        />
                    </PromptInputBody>
                    <PromptInputFooter>
                        <PromptInputTools />
                        <PromptInputSubmit
                            disabled={isProcessing ? false : !input.trim()}
                            status={isProcessing ? "streaming" : undefined}
                        />

                    </PromptInputFooter>
                </PromptInput>


            </div>
        </div>
    );
};