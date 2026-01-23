import { inngest } from "./client";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const demoGenerateText = inngest.createFunction(
  { id: "demo-generate-text" },
  { event: "demo/generate-text" },
  async ({  step }) => {
    await step.run("generate-text", async () => {
       await generateText({
  model: anthropic("claude-sonnet-4-5-20250929"),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
    })
  },
);