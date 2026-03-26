
import ky from "ky";
import { useState } from "react";
import { CopyIcon, HistoryIcon, PlusIcon, LoaderIcon, Plus, ChevronDownIcon, SparklesIcon, BrainIcon, TerminalSquareIcon } from "lucide-react";
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
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { PastConversationsDialog } from "./past-conversations-dialog";
import { useModelPreferences } from "@/features/editor/contexts/model-context";
import { CONVERSATION_MODELS, type ModelOption } from "@/lib/models";
import {
    ModelSelector,
    ModelSelectorTrigger,
    ModelSelectorContent,
    ModelSelectorInput,
    ModelSelectorList,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorItem,
    ModelSelectorLogo,
    ModelSelectorLogoGroup,
    ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import { ThinkingEvents } from "./thinking-events";
import { TerminalPanel } from "@/features/terminal/components/terminal-panel";
import { Allotment } from "allotment";



interface ConversationSidebarProps {
    projectId: string;
}

export const ConversationSidebar = ({ projectId }: ConversationSidebarProps) => {
    const createConversation = useCreateConversation();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [pastConversationsOpen, setPastConversationsOpen] = useState(false);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const conversations = useConversations(projectId);
    const activeConversationId = selectedConversationId ?? conversations.data?.[0]?.id ?? null;
    const activeConversation = useConversation(activeConversationId);
    const { data: conversationMessages } = useMessages(activeConversationId);
    const isProcessing = conversationMessages?.some((message) => message.status === "processing");
    const { conversationModel, setConversationModel } = useModelPreferences();

    const selectedModelOption = CONVERSATION_MODELS.find((m) => m.id === conversationModel) ?? CONVERSATION_MODELS[0];

    const handleCancel = async () => {
        try {
            await ky.post("/api/messages/cancel", {
                json: {
                    projectId,
                },
            });
        } catch (error) {
            toast.error("Failed to cancel requests");
        }
    }
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const handleCreateConversation = async () => {
        try {
            const result = await createConversation.mutateAsync({ projectId, title: DEFAULT_CONVERSATION_TITLE });
            setSelectedConversationId(result.id);
            return result.id;
        } catch (error) {

            toast.error("Failed to create conversation");
            return null;
        }
    };

    const handleSubmit = async (message: PromptInputMessage) => {

        if ((isProcessing || isSending) && !message.text.trim()) {
            await handleCancel();
            setInput("");
            return;
        }

        if (isSending) return;

        setIsSending(true);

        let conversationId = activeConversationId;
        if (!conversationId) {
            conversationId = await handleCreateConversation();
            if (!conversationId) {
                setIsSending(false);
                return;
            }
        }
        //trigger inggest function
        try {
            await ky.post("/api/messages", {
                json: {
                    conversationId,
                    message: message.text,
                    model: conversationModel,
                },
            });
        } catch (error) {
            toast.error("Failed to send message");
        }
        setInput("");
        setIsSending(false);

    }

    return (
        <>
            <PastConversationsDialog
                open={pastConversationsOpen}
                onOpenChange={setPastConversationsOpen}
                projectId={projectId}
                onSelect={setSelectedConversationId}
            />
            <div className="flex flex-col h-full bg-background">
                <div className="h-8.75 flex items-center justify-between border-b">
                    <div className="text-sm truncate pl-3">
                        {activeConversation.data?.title ?? DEFAULT_CONVERSATION_TITLE}
                    </div>
                    <div className="flex-items-center px- gap-1">
                        <Button
                            size="icon-xs"
                            variant='highlight'
                            onClick={() => setPastConversationsOpen(true)}
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

                        <Button
                            size="icon-xs"
                            variant={showTerminal ? "default" : "highlight"}
                            onClick={() => setShowTerminal((v) => !v)}
                            title="Toggle Terminal"
                        >
                            <TerminalSquareIcon className="size-3.5" />
                        </Button>

                    </div>

                </div>
                <Allotment vertical>
                    <Allotment.Pane>
                        <div className="flex flex-col h-full">
                            <Conversation className="flex-1 ">
                                <ConversationContent>
                                    <div className="text-muted-foreground text-sm">
                                        {conversationMessages?.map((message, messageIndex) => (
                                            <Message key={message.id}
                                                from={message.role}
                                            >
                                                <MessageContent>
                                                    {message.role === "assistant" && message.thinking && (
                                                        <ThinkingEvents
                                                            content={message.thinking}
                                                            duration={undefined}
                                                            isProcessing={message.status === "processing"}
                                                        />
                                                    )}
                                                    {message.role === "assistant" && message.status === "processing" && !message.thinking ? (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <LoaderIcon className="size-3.5 animate-spin" />
                                                            <p>Thinking...</p>
                                                        </div>
                                                    ) :
                                                        message.status === "cancelled" ? (
                                                            <span className="text-muted-foreground italic">
                                                                <p> Request Cancelled</p>
                                                            </span>
                                                        ) :
                                                            (
                                                                <MessageResponse>
                                                                    {message.content}
                                                                </MessageResponse>
                                                            )}
                                                </MessageContent>
                                                {message.role === "assistant" &&
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
                                    </div>
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
                                        />
                                    </PromptInputBody>
                                    <PromptInputFooter>
                                        <div className="flex items-center gap-1">
                                            <ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
                                                <ModelSelectorTrigger asChild>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                                    >
                                                        <ModelSelectorLogo provider={selectedModelOption.provider} className="size-3" />
                                                        <span className="truncate max-w-[120px]">{selectedModelOption.name}</span>
                                                        {selectedModelOption.thinking && <BrainIcon className="size-3 text-purple-400" />}
                                                        <ChevronDownIcon className="size-3 opacity-50" />
                                                    </Button>
                                                </ModelSelectorTrigger>
                                                <ModelSelectorContent title="Select Model">
                                                    <ModelSelectorInput placeholder="Search models..." />
                                                    <ModelSelectorList>
                                                        <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                                                        <ModelSelectorGroup heading="Models">
                                                            {CONVERSATION_MODELS.map((model) => (
                                                                <ModelSelectorItem
                                                                    key={model.id}
                                                                    value={model.id}
                                                                    onSelect={() => {
                                                                        setConversationModel(model.id);
                                                                        setModelSelectorOpen(false);
                                                                    }}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <ModelSelectorLogoGroup>
                                                                        <ModelSelectorLogo provider={model.provider} />
                                                                    </ModelSelectorLogoGroup>
                                                                    <ModelSelectorName>{model.name}</ModelSelectorName>
                                                                    {model.thinking && (
                                                                        <span className="ml-auto flex items-center gap-1 text-[10px] text-purple-400 font-medium">
                                                                            <BrainIcon className="size-3" />
                                                                            Thinking
                                                                        </span>
                                                                    )}
                                                                </ModelSelectorItem>
                                                            ))}
                                                        </ModelSelectorGroup>
                                                    </ModelSelectorList>
                                                </ModelSelectorContent>
                                            </ModelSelector>
                                        </div>
                                        <PromptInputSubmit
                                            disabled={(isProcessing || isSending) ? false : !input.trim()}
                                            status={(isProcessing || isSending) ? "streaming" : undefined}
                                        />

                                    </PromptInputFooter>
                                </PromptInput>


                            </div>
                        </div>
                    </Allotment.Pane>
                    {showTerminal && (
                        <Allotment.Pane minSize={120} preferredSize={200}>
                            <TerminalPanel />
                        </Allotment.Pane>
                    )}
                </Allotment>
            </div>
        </>
    );
};