import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";




export async function POST() {
    const responce =  await generateText({
  model: anthropic("claude-sonnet-4-5-20250929"),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});

return Response.json({responce});
}
