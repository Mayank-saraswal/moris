import { useFile, useFileContent, useUpdateFile } from "@/features/projects/hooks/use-files";

import { useEditor } from "../hooks/use-editor";
import { FileBreadcrumbs } from "./file-breadcrumbs";
import { TopNavigation } from "./top-navigation";
import Image from "next/image";
import { CodeEditor } from "./code-editor";
import { useEffect, useRef, useState } from "react";
import { AlertTriangleIcon, ChevronDownIcon, SparklesIcon, PencilIcon, BrainIcon } from "lucide-react";
import { useModelPreferences } from "@/features/editor/contexts/model-context";
import { SUGGESTION_MODELS, QUICK_EDIT_MODELS } from "@/lib/models";
import { Button } from "@/components/ui/button";
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

const DEBOUNCE_TIME = 1000;


export const EditorView = ({ projectId }: { projectId: string }) => {
    const { activeTabId } = useEditor(projectId);
    const { data: activeFile } = useFile(activeTabId);
    const { data: fileContent } = useFileContent(projectId, activeTabId);
    const updateFile = useUpdateFile();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isActiveFileBinary = activeFile && activeFile.blobPath && !fileContent;
    const isActiveFileText = activeFile && fileContent !== undefined;
    const {
        suggestionModel, setSuggestionModel,
        quickEditModel, setQuickEditModel
    } = useModelPreferences();
    const [suggestionSelectorOpen, setSuggestionSelectorOpen] = useState(false);
    const [quickEditSelectorOpen, setQuickEditSelectorOpen] = useState(false);

    const selectedSuggestionOption = SUGGESTION_MODELS.find((m) => m.id === suggestionModel) ?? SUGGESTION_MODELS[0];
    const selectedQuickEditOption = QUICK_EDIT_MODELS.find((m) => m.id === quickEditModel) ?? QUICK_EDIT_MODELS[0];


    //cleanup pending debounce 
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, [activeTabId])

    return (
        <div className="h-full flex flex-col">
            <div className=" flex items-center ">
                <TopNavigation projectId={projectId} />
            </div>
            {activeTabId && <FileBreadcrumbs projectId={projectId} />}
            <div className="flex-1 min-h-0 bg-background">
                {!activeFile && (
                    <div className="size-full flex items-center justify-center">
                        <Image src="/logo.svg" alt="Moris" width={50} height={50}
                            className="opacity-25"
                        />
                    </div>
                )}

                {isActiveFileText && (
                    <CodeEditor
                        key={activeFile.id}
                        initialValue={fileContent?.content ?? ""}
                        onChange={(content: string) => {
                            if (timeoutRef.current) {
                                clearTimeout(timeoutRef.current);
                            }
                            timeoutRef.current = setTimeout(() => {
                                updateFile.mutate({
                                    fileId: activeFile.id,
                                    content: content,
                                })
                            }, DEBOUNCE_TIME);
                        }}
                        fileName={activeFile.name} />
                )}
                {isActiveFileBinary && (
                    <div className="size-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2.5 max-w-md text-center">
                            <AlertTriangleIcon className="size-10 text-yellow-500" />
                            <p className="text-sm">
                                The file is not displayed in the text editor because it is either binary or uses an unsupported text encoding.
                            </p>
                        </div>
                    </div>
                )}

            </div>

            {/* AI Model Status Bar */}
            <div className="h-7 flex items-center justify-end gap-2 border-t px-2 bg-background text-xs text-muted-foreground">
                {/* Suggestion Model Selector */}
                <ModelSelector open={suggestionSelectorOpen} onOpenChange={setSuggestionSelectorOpen}>
                    <ModelSelectorTrigger asChild>
                        <Button size="xs" variant="ghost" className="gap-1 text-[11px] h-5 px-1.5 text-muted-foreground hover:text-foreground">
                            <SparklesIcon className="size-3" />
                            <ModelSelectorLogo provider={selectedSuggestionOption.provider} className="size-2.5" />
                            <span className="truncate max-w-[100px]">{selectedSuggestionOption.name}</span>
                            <ChevronDownIcon className="size-2.5 opacity-50" />
                        </Button>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent title="Suggestion Model">
                        <ModelSelectorInput placeholder="Search models..." />
                        <ModelSelectorList>
                            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                            <ModelSelectorGroup heading="Suggestion Models">
                                {SUGGESTION_MODELS.map((model) => (
                                    <ModelSelectorItem
                                        key={model.id}
                                        value={model.id}
                                        onSelect={() => {
                                            setSuggestionModel(model.id);
                                            setSuggestionSelectorOpen(false);
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <ModelSelectorLogoGroup>
                                            <ModelSelectorLogo provider={model.provider} />
                                        </ModelSelectorLogoGroup>
                                        <ModelSelectorName>{model.name}</ModelSelectorName>
                                    </ModelSelectorItem>
                                ))}
                            </ModelSelectorGroup>
                        </ModelSelectorList>
                    </ModelSelectorContent>
                </ModelSelector>

                {/* Quick Edit Model Selector */}
                <ModelSelector open={quickEditSelectorOpen} onOpenChange={setQuickEditSelectorOpen}>
                    <ModelSelectorTrigger asChild>
                        <Button size="xs" variant="ghost" className="gap-1 text-[11px] h-5 px-1.5 text-muted-foreground hover:text-foreground">
                            <PencilIcon className="size-3" />
                            <ModelSelectorLogo provider={selectedQuickEditOption.provider} className="size-2.5" />
                            <span className="truncate max-w-[100px]">{selectedQuickEditOption.name}</span>
                            <ChevronDownIcon className="size-2.5 opacity-50" />
                        </Button>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent title="Quick Edit Model">
                        <ModelSelectorInput placeholder="Search models..." />
                        <ModelSelectorList>
                            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                            <ModelSelectorGroup heading="Quick Edit Models">
                                {QUICK_EDIT_MODELS.map((model) => (
                                    <ModelSelectorItem
                                        key={model.id}
                                        value={model.id}
                                        onSelect={() => {
                                            setQuickEditModel(model.id);
                                            setQuickEditSelectorOpen(false);
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <ModelSelectorLogoGroup>
                                            <ModelSelectorLogo provider={model.provider} />
                                        </ModelSelectorLogoGroup>
                                        <ModelSelectorName>{model.name}</ModelSelectorName>
                                    </ModelSelectorItem>
                                ))}
                            </ModelSelectorGroup>
                        </ModelSelectorList>
                    </ModelSelectorContent>
                </ModelSelector>
            </div>

        </div>
    );
};