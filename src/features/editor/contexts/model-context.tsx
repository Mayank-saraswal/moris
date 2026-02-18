"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
    DEFAULT_CONVERSATION_MODEL,
    DEFAULT_SUGGESTION_MODEL,
    DEFAULT_QUICK_EDIT_MODEL,
} from "@/lib/models";
import { modelStore } from "@/features/editor/extensions/model-store";

interface ModelContextValue {
    conversationModel: string;
    setConversationModel: (model: string) => void;
    suggestionModel: string;
    setSuggestionModel: (model: string) => void;
    quickEditModel: string;
    setQuickEditModel: (model: string) => void;
}

const ModelContext = createContext<ModelContextValue | null>(null);

const STORAGE_KEY = "moris-model-preferences";

interface StoredPreferences {
    conversationModel: string;
    suggestionModel: string;
    quickEditModel: string;
}

function loadPreferences(): StoredPreferences {
    if (typeof window === "undefined") {
        return {
            conversationModel: DEFAULT_CONVERSATION_MODEL,
            suggestionModel: DEFAULT_SUGGESTION_MODEL,
            quickEditModel: DEFAULT_QUICK_EDIT_MODEL,
        };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                conversationModel: parsed.conversationModel ?? DEFAULT_CONVERSATION_MODEL,
                suggestionModel: parsed.suggestionModel ?? DEFAULT_SUGGESTION_MODEL,
                quickEditModel: parsed.quickEditModel ?? DEFAULT_QUICK_EDIT_MODEL,
            };
        }
    } catch { }

    return {
        conversationModel: DEFAULT_CONVERSATION_MODEL,
        suggestionModel: DEFAULT_SUGGESTION_MODEL,
        quickEditModel: DEFAULT_QUICK_EDIT_MODEL,
    };
}

export const ModelProvider = ({ children }: { children: ReactNode }) => {
    const [prefs, setPrefs] = useState<StoredPreferences>(loadPreferences);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }, [prefs]);

    // Sync to module-level store for CodeMirror extensions
    useEffect(() => {
        modelStore.suggestionModel = prefs.suggestionModel;
        modelStore.quickEditModel = prefs.quickEditModel;
    }, [prefs.suggestionModel, prefs.quickEditModel]);

    const setConversationModel = useCallback(
        (model: string) => setPrefs((p) => ({ ...p, conversationModel: model })),
        []
    );
    const setSuggestionModel = useCallback(
        (model: string) => setPrefs((p) => ({ ...p, suggestionModel: model })),
        []
    );
    const setQuickEditModel = useCallback(
        (model: string) => setPrefs((p) => ({ ...p, quickEditModel: model })),
        []
    );

    return (
        <ModelContext.Provider
            value={{
                conversationModel: prefs.conversationModel,
                setConversationModel,
                suggestionModel: prefs.suggestionModel,
                setSuggestionModel,
                quickEditModel: prefs.quickEditModel,
                setQuickEditModel,
            }}
        >
            {children}
        </ModelContext.Provider>
    );
};

export const useModelPreferences = () => {
    const ctx = useContext(ModelContext);
    if (!ctx) {
        throw new Error("useModelPreferences must be used within a ModelProvider");
    }
    return ctx;
};
