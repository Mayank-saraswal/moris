"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, LoaderIcon } from "lucide-react";

interface ThinkingEventsProps {
    content?: string;
    duration?: number;
    isProcessing?: boolean;
}

export const ThinkingEvents = ({ content, duration, isProcessing }: ThinkingEventsProps) => {
    const [expanded, setExpanded] = useState(false);

    if (!content && !isProcessing) return null;

    const seconds = duration ? Math.round(duration / 1000) : null;
    const durationLabel = isProcessing
        ? "Thinking..."
        : seconds !== null
            ? `Thought for ${seconds}s`
            : "Thought";

    return (
        <div className="mb-3 rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
            <button
                onClick={() => setExpanded((v) => !v)}
                className={cn(
                    "flex items-center gap-1.5 w-full text-left px-3 py-2 text-xs text-muted-foreground/70",
                    "hover:text-muted-foreground hover:bg-muted/50 transition-colors duration-150",
                )}
            >
                {isProcessing ? (
                    <LoaderIcon className="size-3 animate-spin shrink-0" />
                ) : (
                    <ChevronRightIcon
                        className={cn(
                            "size-3.5 transition-transform duration-200 shrink-0",
                            expanded && "rotate-90"
                        )}
                    />
                )}
                <span>{durationLabel}</span>
            </button>

            {expanded && content && (
                <div
                    className={cn(
                        "px-3 pb-3 pt-0 border-t border-border/30",
                        "text-xs text-muted-foreground/60 leading-relaxed",
                        "whitespace-pre-wrap",
                        "max-h-[180px] overflow-y-auto",
                    )}
                >
                    {content}
                </div>
            )}
        </div>
    );
};
