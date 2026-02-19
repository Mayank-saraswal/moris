import { createAgent, openai, createNetwork } from "@inngest/agent-kit";

import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest";
import { prisma } from "@/lib/prisma";
import { deductTokens } from "@/lib/tokens";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT,
} from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { createReadFilesTool } from "./tools/read-files";
import { createListFilesTool } from "./tools/list-files";
import { createUpdateFileTool } from "./tools/update-file";
import { createCreateFilesTool } from "./tools/create-files";
import { createCreateFolderTool } from "./tools/create-folder";
import { createRenameFileTool } from "./tools/rename-file";
import { createDeleteFilesTool } from "./tools/delete-files";
import { createScrapeUrlsTool } from "./tools/scrape-urls";

interface MessageEvent {
  messageId: string;
  conversationId: string;
  projectId: string;
  message: string;
  model?: string;
  userId?: string;
}

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;

      await step.run("update-message-on-failure", async () => {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            content:
              "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
            status: "error",
          },
        });
      });
    },
  },
  {
    event: "message/sent",
  },
  async ({ event, step }) => {
    const {
      messageId,
      conversationId,
      projectId,
      message,
      model: userModel,
      userId,
    } = event.data as MessageEvent;

    const selectedModel = userModel || "anthropic/claude-3.5-haiku";

    await step.sleep("wait-for-db-sync", "1s");

    // Get conversation for title generation check
    const conversation = await step.run("get-conversation", async () => {
      return await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, title: true, projectId: true },
      });
    });

    if (!conversation) {
      throw new NonRetriableError("Conversation not found");
    }

    // Fetch recent messages for conversation context
    const recentMessages = await step.run("get-recent-messages", async () => {
      return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, role: true, content: true },
      });
    });

    // Build system prompt with conversation history
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    const contextMessages = recentMessages
      .reverse()
      .filter((msg: { id: string; content: string; role: string }) => msg.id !== messageId && msg.content.trim() !== "");

    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg: { role: string; content: string }) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    // Generate conversation title if still default
    const shouldGenerateTitle =
      conversation.title === DEFAULT_CONVERSATION_TITLE;

    if (shouldGenerateTitle) {
      const titleAgent = createAgent({
        name: "title-generator",
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        model: openai({
          model: selectedModel,
          baseUrl: "https://openrouter.ai/api/v1",
          apiKey: process.env.OPENROUTER_API_KEY,
          defaultParameters: { temperature: 0, max_completion_tokens: 50 },
        }),
      });

      const { output } = await titleAgent.run(message, { step });

      const textMessage = output.find(
        (m) => m.type === "text" && m.role === "assistant"
      );

      if (textMessage?.type === "text") {
        const title =
          typeof textMessage.content === "string"
            ? textMessage.content.trim()
            : textMessage.content
              .map((c) => c.text)
              .join("")
              .trim();

        if (title) {
          await step.run("update-conversation-title", async () => {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { title },
            });
          });
        }
      }
    }

    // Track reasoning for real-time "thinking" updates
    const thinkingStartTime = Date.now();
    const reasoningChunks: string[] = [];
    const actionLog: string[] = [];

    const extractText = (
      content: string | Array<{ type: string; text: string }>
    ): string => {
      if (typeof content === "string") return content;
      return content.map((c) => c.text).join("");
    };

    const toolLabels: Record<string, string> = {
      listFiles: "Browsing the project structure",
      readFiles: "Reading file contents",
      updateFile: "Updating a file",
      createFiles: "Creating new files",
      createFolder: "Creating a new folder",
      renameFile: "Renaming a file",
      deleteFiles: "Deleting files",
      scrapeUrls: "Fetching URL content",
    };

    // Flush thinking state to Supabase (for real-time UI via Supabase Realtime)
    const flushThinking = async () => {
      const parts: string[] = [];
      if (reasoningChunks.length > 0) {
        parts.push(reasoningChunks.join("\n\n"));
      }
      if (actionLog.length > 0) {
        parts.push(actionLog.join("\n\n"));
      }
      const content = parts.join("\n\n") || "Analyzing your request...";
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            thinking: content,
          },
        });
      } catch {
        // Don't let thinking updates break the agent
      }
    };

    await flushThinking();

    // Create the coding agent with PROJECT-SCOPED tools
    const codingAgent = createAgent({
      name: "polaris",
      description: "An expert AI coding assistant",
      system: systemPrompt,
      model: openai({
        model: selectedModel,
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultParameters: { temperature: 0.3, max_completion_tokens: 4096 },
      }),
      tools: [
        createListFilesTool({ projectId }),
        createReadFilesTool(),
        createUpdateFileTool(),
        createCreateFilesTool({ projectId }),
        createCreateFolderTool({ projectId }),
        createRenameFileTool(),
        createDeleteFilesTool(),
        createScrapeUrlsTool(),
      ],
      lifecycle: {
        onResponse: async ({ result }) => {
          for (const msg of result.output) {
            if (msg.type === "text" && msg.role === "assistant") {
              const text = extractText(msg.content);
              if (text.trim()) {
                reasoningChunks.push(text.trim());
              }
            }
            if (msg.type === "tool_call") {
              for (const tool of msg.tools ?? []) {
                const label = toolLabels[tool.name] ?? `Running ${tool.name}`;
                actionLog.push(label);
              }
            }
          }
          await flushThinking();
          return result;
        },
        onFinish: async ({ result }) => {
          for (const msg of result.output) {
            if (msg.type === "text" && msg.role === "assistant") {
              const text = extractText(msg.content);
              if (text.trim()) {
                reasoningChunks.push(text.trim());
              }
            }
          }
          await flushThinking();
          return result;
        },
      },
    });

    // Create network with single agent
    const network = createNetwork({
      name: "polaris-network",
      agents: [codingAgent],
      maxIter: 20,
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output.some(
          (m) => m.type === "text" && m.role === "assistant"
        );
        const hasToolCalls = lastResult?.output.some(
          (m) => m.type === "tool_call"
        );

        if (hasTextResponse && !hasToolCalls) {
          return undefined;
        }
        return codingAgent;
      },
    });

    // Run the agent network
    let assistantResponse =
      "I processed your request. Let me know if you need anything else!";

    try {
      const result = await network.run(message);

      const lastResult = result.state.results.at(-1);
      const textMessage = lastResult?.output.find(
        (m) => m.type === "text" && m.role === "assistant"
      );

      if (textMessage?.type === "text") {
        assistantResponse =
          typeof textMessage.content === "string"
            ? textMessage.content
            : textMessage.content.map((c) => c.text).join("");
      }
    } catch (error) {
      console.error("Agent network error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes("parse JSON") || errorMsg.includes("JSON")) {
        assistantResponse =
          "I'm sorry, the selected model returned a malformed response. This can happen with some models when generating code. Please try again, or switch to a different model (e.g. Claude Sonnet 4.5 or GPT-4o) for more reliable results.";
      } else {
        assistantResponse =
          "I encountered an error while processing your request. Please try again or switch to a different model.";
      }
    }

    // Update the assistant message with the response
    await step.run("update-assistant-message", async () => {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: assistantResponse,
          status: "completed",
          model: selectedModel,
        },
      });
    });

    // Deduct tokens (estimate if exact usage unavailable)
    if (userId) {
      await step.run("deduct-tokens", async () => {
        // Rough estimate: prompt ~2000 tokens, response ~1000 tokens
        // In production, OpenRouter's generation ID endpoint provides exact counts
        const estimatedPromptTokens = Math.ceil(message.length / 4) + 2000;
        const estimatedCompletionTokens = Math.ceil(
          assistantResponse.length / 4
        );

        await deductTokens({
          userId,
          model: selectedModel,
          promptTokens: estimatedPromptTokens,
          completionTokens: estimatedCompletionTokens,
          action: "conversation",
          projectId,
        });
      });
    }

    return { success: true, messageId, conversationId };
  }
);
