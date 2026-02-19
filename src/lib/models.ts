export interface ModelOption {
    id: string;
    name: string;
    provider: string;
    thinking?: boolean;
}

export const CONVERSATION_MODELS: ModelOption[] = [
    { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "anthropic" },
    { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", provider: "anthropic" },
    { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "anthropic" },
    { id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" },
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "google" },
    { id: "openrouter/quasar-alpha", name: "Quasar Alpha", provider: "openrouter" },
    { id: "deepseek/deepseek-r1-0528", name: "DeepSeek R1", provider: "deepseek", thinking: true },
    { id: "openai/o3-mini", name: "o3-mini", provider: "openai", thinking: true },
    { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "anthropic" },
    { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash", provider: "stepfun" },
    { id: "arcee-ai/trinity-large-preview:free", name: "Trinity Large Preview", provider: "arcee-ai" },
];

export const SUGGESTION_MODELS: ModelOption[] = [
    { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "anthropic" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
    { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "anthropic" },
    { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "anthropic" },
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "google" },
    { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash", provider: "stepfun" },
    { id: "arcee-ai/trinity-large-preview:free", name: "Trinity Large Preview", provider: "arcee-ai" },
];

export const QUICK_EDIT_MODELS: ModelOption[] = [
    { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "anthropic" },
    { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "anthropic" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
    { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "anthropic" },
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "google" },
    { id: "openrouter/quasar-alpha", name: "Quasar Alpha", provider: "openrouter" },
    { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash", provider: "stepfun" },
    { id: "arcee-ai/trinity-large-preview:free", name: "Trinity Large Preview", provider: "arcee-ai" },
];

export const DEFAULT_CONVERSATION_MODEL = CONVERSATION_MODELS[0].id;
export const DEFAULT_SUGGESTION_MODEL = SUGGESTION_MODELS[0].id;
export const DEFAULT_QUICK_EDIT_MODEL = QUICK_EDIT_MODELS[0].id;
