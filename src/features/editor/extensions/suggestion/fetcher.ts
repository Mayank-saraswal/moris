import ky from "ky";
import z from "zod/v3";
import { toast } from "sonner";


const suggestionRequestSchema = z.object({
    fileName: z.string(),
    code: z.string(),
    currentLine: z.string(),
    previousLines: z.string().optional(),
    nextLines: z.string().optional(),
    textBeforeCursor: z.string(),
    textAfterCursor: z.string(),
    cursor: z.number(),
    lineNumber: z.number(),
});

const suggestionResponseSchema = z.object({
    suggestion: z.string(),
});

type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;


export const fetcher = async (
    payload: SuggestionRequest,
    signal: AbortSignal
): Promise<string | null> => {
    try {
        const vaildatedPayload = suggestionRequestSchema.parse(payload);
        const response = await ky.post("/api/suggestion", {
            json: vaildatedPayload,
            signal,
            timeout: 10000,
            retry: 0
        })
            .json<SuggestionResponse>();

        const vaildatedResponse = suggestionResponseSchema.parse(response);
        return vaildatedResponse.suggestion || null;

    }
    catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return null
        }
        toast.error("Failed to fetch suggestion form Ai");
        return null;
    }

};