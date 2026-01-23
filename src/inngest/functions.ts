import { inngest } from "./client";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { firecrawl } from "@/lib/firecrawl";
import { google } from "@ai-sdk/google";

const URL_REGEX = /https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/g;

export const demoGenerateText = inngest.createFunction(
    { id: "demo-generate-text" },
    { event: "demo/generate-text" },
    async ({ event, step }) => {
        const { prompt } = event.data as { prompt: string };

        const urls = await step.run("extract-urls", async () => {
            return prompt.match(URL_REGEX) ?? [];
        }) as string[];


        const scrapedContent = await step.run("scrape-content", async () => {
            const results = await Promise.all(
                urls.map(async (url) => {
                    const result = await firecrawl.scrape(url, { formats: ["markdown"] });
                    return result.markdown ?? null;
                })
            )
            return results.filter(Boolean).join("\n\n");
        })

        const finalPrompt = scrapedContent
            ? `Context:\n${scrapedContent}\n\nQuestion:${prompt}`
            : prompt;



        return await step.run("generate-text", async () => {
            return await generateText({
                model: anthropic("claude-3-5-sonnet"),
                prompt: finalPrompt,
            });
        }); 
    },
);