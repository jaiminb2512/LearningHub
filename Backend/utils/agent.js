import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";
import { DEFAULT_AI_SETTINGS } from "./aiConfig.js";
import { createBookTool, listBooksTool, getBookTool, updateBookTool, deleteBookTool, createNoteTool, listNotesTool, getNoteTool, updateNoteTool, deleteNoteTool, reorderNotesTool } from "./aiTools.js";
import { softDeleteBook } from "../services/bookService.js";

dotenv.config();

export const generateMessage = async (
  systemPrompt,
  messages,
  provider,
  model,
  options = {}
) => {
  const chat = new ChatGoogleGenerativeAI({
    model: model || DEFAULT_AI_SETTINGS.model,
    apiKey: process.env.GEMINI_API_KEY,
    temperature: options.temperature ?? DEFAULT_AI_SETTINGS.temperature,
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_AI_SETTINGS.maxOutputTokens,
  });

  const response = await chat.invoke([
    { role: "system", content: systemPrompt },
    ...messages,
  ]);

  return response;
};

export const streamMessage = async function* (
  systemPrompt,
  messages,
  model,
  options = {},
  userId,
  threadId
) {
  const tools = [createBookTool(userId, threadId), listBooksTool(userId), updateBookTool(userId), getBookTool(userId), deleteBookTool(userId), createNoteTool(userId), listNotesTool(userId), getNoteTool(userId), updateNoteTool(userId), deleteNoteTool(userId), reorderNotesTool(userId)];

  const chat = new ChatGoogleGenerativeAI({
    model: model || DEFAULT_AI_SETTINGS.model,
    apiKey: process.env.GEMINI_API_KEY,
    streamUsage: true,
    temperature: options.temperature ?? DEFAULT_AI_SETTINGS.temperature,
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_AI_SETTINGS.maxOutputTokens,
  }).bindTools(tools);

  // Prepare standard messages array
  const currentMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  while (true) {
    const stream = await chat.stream(currentMessages);
    let aiMessage = null;

    for await (const chunk of stream) {
      // Accumulate the chunks into a single message
      if (!aiMessage) {
        aiMessage = chunk;
      } else {
        aiMessage = aiMessage.concat(chunk);
      }

      // Yield content chunks to the controller (ensure we only yield strings, not objects)
      if (chunk.content) {
        if (typeof chunk.content === "string") {
          yield chunk;
        } else if (Array.isArray(chunk.content)) {
          const textContent = chunk.content
            .filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("");
          if (textContent) {
            yield { ...chunk, content: textContent };
          }
        }
      }
    }

    currentMessages.push(aiMessage);

    // If the model called any tools, execute them
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {

      for (const toolCall of aiMessage.tool_calls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (tool) {
          try {
            // execute tool and append the result to messages
            const result = await tool.invoke(toolCall.args);
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: tool.name,
              content: typeof result === "string" ? result : JSON.stringify(result),
            });
          } catch (error) {
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: tool.name,
              content: `Error: ${error.message}`,
            });
          }
        }
      }
      // The while loop continues, sending the tool results back to the LLM
    } else {
      // No tools called, the LLM has finished its final response
      break;
    }
  }
};

export const generateEmbedding = async (text) => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
  });
  const vector = await embeddings.embedQuery(text);
  return vector;
};