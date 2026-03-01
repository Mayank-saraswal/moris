
import { openrouter } from "@/lib/openrouter";
import { generateObject, generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { firecrawl } from "@/lib/firecrawl";
import { auth } from "@clerk/nextjs/server";

const quickEditRequestSchema = z.object({
    selectedCode: z.string().min(1, "Selected code is required"),
    fullCode: z.string().optional().default(""),
    instruction: z.string().min(1, "Instruction is required"),
    model: z.string().optional(),
});

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;



const QUICK_EDIT_PROMPT = `You are a code editing assistant. Edit the selected code based on the user's instruction.

<context>
<selected_code>
{selectedCode}
</selected_code>
<full_code_context>
{fullCode}
</full_code_context>
</context>

{documentation}

<instruction>
{instruction}
</instruction>

<instructions>
Return ONLY the edited version of the selected code.
Maintain the same indentation level as the original.
Do not include any explanations or comments unless requested.
If the instruction is unclear or cannot be applied, return the original code unchanged.
</instructions>`;

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json();
        const { selectedCode, fullCode, instruction, model } = quickEditRequestSchema.parse(body);

        const urls: string[] = instruction.match(URL_REGEX) || [];
        let documentationContext = "";
        if (urls.length > 0) {
            const scrapedResults = await Promise.all(
                urls.map(async (url: string) => {
                    try {
                        const result = await firecrawl.scrape(url, {
                            formats: ["markdown"],

                        });
                        if (result.markdown) {
                            return `
                            <doc url="${url}">\n${result.markdown}\n</doc>\n`
                        }
                        return null
                    } catch (error) {
                        return null
                    }
                })
            );
            const validResults = scrapedResults.filter(Boolean);
            if (validResults.length > 0) {
                documentationContext = `
                <documentation>
                ${validResults.join("\n\n")}\n
                </documentation>
                `
            }

        }

        const prompt = QUICK_EDIT_PROMPT
            .replace("{selectedCode}", selectedCode)
            .replace("{fullCode}", fullCode || "")
            .replace("{instruction}", instruction)
            .replace("{documentation}", documentationContext);

        const quickEditResponseSchema = z.object({
            editedCode: z
                .string()
                .describe("The edited version of the selected code based on the instructions"),
        });

        const { text } = await generateText({
            model: openrouter(model || "anthropic/claude-3.5-haiku"),
            prompt,
            output: Output.object({
                schema: quickEditResponseSchema,
            })
        })

        return NextResponse.json({ editedCode: text }, { status: 200 });


    } catch (error) {
        console.error(" Failed to generate code edit:", error);
        return NextResponse.json({ error: "Failed to generate code edit" }, { status: 500 });
    };
}
