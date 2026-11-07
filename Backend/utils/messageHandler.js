import {
  multiAgentGraph,
  extractInterruptPayload,
  extractAssistantText,
} from "./agent.js";
import { normalizeHitlDecision } from "./hitl.js";
import {
  startChatTrace,
  endTrace,
  recordError,
  flushObservability,
  messagePreview,
  getLangfuseCallbackHandler,
} from "../services/observabilityService.js";

export const streamMessage = async function* (
  systemPrompt,
  summary = "",
  messages,
  model,
  options = {},
  userId,
  threadId,
) {
  const trace = startChatTrace({
    name: "learninghub-chat",
    userId,
    threadId,
    input: messagePreview(messages),
    metadata: {
      model,
      flow: "stream",
      ragEnabled: options.ragEnabled,
    },
  });

  try {
    const langfuseHandler = getLangfuseCallbackHandler({
      userId,
      threadId,
      metadata: { model, flow: "stream" },
    });

    const graph = await multiAgentGraph({
      model,
      options,
      userId,
      threadId,
      systemPrompt,
      summary,
      knowledgeRagEnabled: options.knowledgeRagEnabled,
      ragEnabled: options.ragEnabled,
      langfuseHandler,
    });

    const config = {
      configurable: {
        thread_id: threadId,
      },
      callbacks: langfuseHandler ? [langfuseHandler] : undefined,
    };

    // Keep system prompt out of graph state; inject only when calling Gemini.
    const result = await graph.invoke({ messages, summary }, config);
    const interruptPayload = extractInterruptPayload(result);

    if (interruptPayload) {
      endTrace(trace, {
        output: {
          status: "interrupted",
          interrupt: {
            type: interruptPayload.type,
            action: interruptPayload.action,
            message: interruptPayload.message,
          },
        },
        metadata: { status: "interrupted" },
      });
      yield {
        type: "interrupt",
        interrupt: {
          ...interruptPayload,
          threadId,
        },
      };
      return;
    }

    const content = extractAssistantText(result);
    endTrace(trace, {
      output: content,
      metadata: { status: "completed" },
    });
    if (content) {
      yield { type: "content", content };
    }
  } catch (error) {
    recordError(trace, error);
    throw error;
  } finally {
    await flushObservability();
  }
};

export const resumeMessage = async function* ({
  threadId,
  userId,
  model,
  options = {},
  systemPrompt = "",
  decision,
}) {
  const normalizedDecision = normalizeHitlDecision(decision);
  const trace = startChatTrace({
    name: "learninghub-chat-resume",
    userId,
    threadId,
    input: {
      decision: {
        approved: normalizedDecision.approved,
        redirected: normalizedDecision.redirected,
        selected: normalizedDecision.selected,
        hasUserMessage: Boolean(normalizedDecision.userMessage),
      },
    },
    metadata: {
      model,
      flow: "resume",
    },
  });

  try {
    const graph = await buildGraph({
      model,
      options,
      userId,
      threadId,
      systemPrompt,
    });

    const langfuseHandler = getLangfuseCallbackHandler({
      userId,
      threadId,
      metadata: { model, flow: "resume" },
    });
    const config = {
      configurable: {
        thread_id: threadId,
      },
      callbacks: langfuseHandler ? [langfuseHandler] : undefined,
    };

    const result = await graph.invoke(
      new Command({ resume: normalizedDecision }),
      config,
    );

    const interruptPayload = extractInterruptPayload(result);
    if (interruptPayload) {
      endTrace(trace, {
        output: {
          status: "interrupted",
          interrupt: {
            type: interruptPayload.type,
            action: interruptPayload.action,
            message: interruptPayload.message,
          },
        },
        metadata: { status: "interrupted" },
      });
      yield {
        type: "interrupt",
        interrupt: {
          ...interruptPayload,
          threadId,
        },
      };
      return;
    }

    const content = extractAssistantText(result);
    endTrace(trace, {
      output: content,
      metadata: { status: "completed" },
    });
    if (content) {
      yield { type: "content", content };
    }
  } catch (error) {
    recordError(trace, error);
    throw error;
  } finally {
    await flushObservability();
  }
};
