import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";




export async function POST() {
    const responce =  await generateText({
  model: anthropic("claude-3-5-sonnet"),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  experimental_telemetry:{
    isEnabled:true,
    recordInputs:true,
    recordOutputs:true
    
  }
});

return Response.json({responce});
}
