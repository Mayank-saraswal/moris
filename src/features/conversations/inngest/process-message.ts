import { createAgent, openai, createNetwork } from '@inngest/agent-kit';

import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT
} from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { createReadFilesTool } from './tools/read-files';
import { createListFilesTool } from './tools/list-files';
import { createUpdateFileTool } from './tools/update-file';
import { createCreateFilesTool } from './tools/create-files';
import { createCreateFolderTool } from './tools/create-folder';
import { createRenameFileTool } from './tools/rename-file';
import { createDeleteFilesTool } from './tools/delete-files';
import { createScrapeUrlsTool } from './tools/scrape-urls';

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
  model?: string;
};

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
      const internalKey = process.env.MORIS_CONVEX_INTERNAL_KEY;

      // Update the message with error content
      if (internalKey) {
        await step.run("update-message-on-failure", async () => {
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
          });
        });
      }
    }
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
      model: userModel
    } = event.data as MessageEvent;

    const selectedModel = userModel || "anthropic/claude-3.5-haiku";

    const internalKey = process.env.MORIS_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new NonRetriableError("MORIS_CONVEX_INTERNAL_KEY is not configured");
    }

    // TODO: Check if this is needed
    await step.sleep("wait-for-db-sync", "1s");

    // Get conversation for title generation check
    const conversation = await step.run("get-conversation", async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });
    });

    if (!conversation) {
      throw new NonRetriableError("Conversation not found");
    }

    // Fetch recent messages for conversation context
    const recentMessages = await step.run("get-recent-messages", async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: 10,
      });
    });

    // Build system prompt with conversation history (exclude the current processing message)
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    // Filter out the current processing message and empty messages
    const contextMessages = recentMessages.filter(
      (msg) => msg._id !== messageId && msg.content.trim() !== ""
    );

    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    // Generate conversation title if it's still the default
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
            await convex.mutation(api.system.updateConversationTitle, {
              internalKey,
              conversationId,
              title,
            });
          });
        }
      }
    }

    // Track the LLM's reasoning text and timing
    const thinkingStartTime = Date.now();
    const reasoningChunks: string[] = [];
    const actionLog: string[] = [];

    // Helper to extract text from a TextMessage content
    const extractText = (content: string | Array<{ type: string; text: string }>): string => {
      if (typeof content === "string") return content;
      return content.map((c) => c.text).join("");
    };

    // Tool labels for human-readable descriptions
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

    // Flush current thinking state to Convex
    const flushThinking = async () => {
      // Combine reasoning text + action descriptions
      const parts: string[] = [];
      if (reasoningChunks.length > 0) {
        parts.push(reasoningChunks.join("\n\n"));
      }
      if (actionLog.length > 0) {
        parts.push(actionLog.join("\n\n"));
      }
      const content = parts.join("\n\n") || "Analyzing your request...";
      try {
        await convex.mutation(api.system.setThinkingContent, {
          internalKey,
          messageId,
          content,
          duration: Date.now() - thinkingStartTime,
        });
      } catch {
        // Don't let thinking event failures break the agent
      }
    };

    // Write initial thinking state immediately
    await flushThinking();

    // Create the coding agent with file tools
    const codingAgent = createAgent({
      name: "polaris",
      description: "An expert AI coding assistant",
      system: systemPrompt,
      model: openai({
        model: selectedModel,
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultParameters: { temperature: 0.3, max_completion_tokens: 4096 }
      }),
      tools: [
        createListFilesTool({ internalKey, projectId }),
        createReadFilesTool({ internalKey }),
        createUpdateFileTool({ internalKey }),
        createCreateFilesTool({ projectId, internalKey }),
        createCreateFolderTool({ projectId, internalKey }),
        createRenameFileTool({ internalKey }),
        createDeleteFilesTool({ internalKey }),
        createScrapeUrlsTool(),
      ],
      lifecycle: {
        onResponse: async ({ result }) => {
          // Capture the LLM's text reasoning
          for (const msg of result.output) {
            if (msg.type === "text" && msg.role === "assistant") {
              const text = extractText(msg.content);
              if (text.trim()) {
                reasoningChunks.push(text.trim());
              }
            }
            // Log tool calls as readable actions
            if (msg.type === "tool_call") {
              for (const tool of msg.tools ?? []) {
                const label = toolLabels[tool.name] ?? `Running ${tool.name}`;
                actionLog.push(label);
              }
            }
          }

          // Flush immediately so UI updates in real-time
          await flushThinking();
          return result;
        },
        onFinish: async ({ result }) => {
          // Capture any final reasoning text
          for (const msg of result.output) {
            if (msg.type === "text" && msg.role === "assistant") {
              const text = extractText(msg.content);
              if (text.trim()) {
                reasoningChunks.push(text.trim());
              }
            }
          }

          // Final flush with complete content
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

        // Anthropic outputs text AND tool calls together
        // Only stop if there's text WITHOUT tool calls (final response)
        if (hasTextResponse && !hasToolCalls) {
          return undefined;
        }
        return codingAgent;
      }
    });

    // Run the agent network at the top level (not inside step.run)
    // The AUTOMATIC_PARALLEL_INDEXING warning is benign and doesn't affect execution
    let assistantResponse =
      "I processed your request. Let me know if you need anything else!";

    try {
      const result = await network.run(message);

      // Extract the assistant's text response from the last agent result
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

    // Update the assistant message with the response (this also sets status to completed)
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResponse,
      })
    });

    return { success: true, messageId, conversationId };

  }
);
