import { AI_PROVIDERS } from "../utils/aiConfig.js";
import sendResponse from "../utils/response.js";
import { generateMessage, streamMessage } from "../utils/agent.js";
import prisma from "../dbConnect/prismaClient.js";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { encode } from "gpt-tokenizer";

/**
 * @desc    Get list of AI providers and models
 * @route   GET /api/ai/providers
 * @access  Private
 */
export const getProviders = async (req, res) => {
  try {
    return sendResponse(res, 200, "AI providers fetched successfully", AI_PROVIDERS);
  } catch (error) {
    console.error("getProviders error:", error);
    return sendResponse(res, 500, "Failed to fetch AI providers", { error: error.message });
  }
};

/**
 * @desc    Generate AI response
 * @route   POST /api/ai/generate
 * @access  Private
 */

export const generate = async (req, res) => {
  try {

    const { threadId, message } = req.body;

    if (!message) {
      return sendResponse(res, 400, "Message is required");
    }

    if (!threadId) {
      return sendResponse(res, 400, "Thread is required");
    }

    const threadData = await prisma.thread.findUnique({
      where: { threadId },
      include: { systemPrompt: true },
    });

    if (!threadData) {
      return sendResponse(res, 400, "Thread not found");
    }

    let promptText = threadData.systemPrompt?.prompt;
    if (!promptText) {
      const fallback = await prisma.systemPrompt.findFirst({
        where: { name: "AI chat" },
      });
      promptText = fallback?.prompt;
    }

    if (!promptText) {
      return sendResponse(res, 400, "No system prompt linked to this thread");
    }

    // 1. Get current message history and order
    const existingMessages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { sequence: "asc" }
    });

    const nextSequence = existingMessages.length + 1;

    // 2. Save the User's current message to DB first
    const userMessage = await prisma.message.create({
      data: {
        threadId,
        role: "user",
        content: message,
        model: "gemini-3.1-flash-lite-preview", // Use a valid model name
        provider: "google",
        sequence: nextSequence
      }
    });

    // 3. Prepare message history for LangChain
    // Limit to last 10 messages for context
    const historyMessages = existingMessages.slice(-10);

    const formattedMessages = [
      ...historyMessages.map(m =>
        m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content)
      ),
      new HumanMessage(message)
    ];

    // 4. Generate AI response
    const response = await generateMessage(
      promptText,
      formattedMessages,
      "google",
      "gemini-3.1-flash-lite-preview"
    );

    // 5. Save the Assistant's response to DB
    const aiContent = typeof response.content === 'string'
      ? response.content
      : (Array.isArray(response.content) && response.content.length === 0
        ? ""
        : JSON.stringify(response.content));

    await prisma.message.create({
      data: {
        threadId,
        role: "assistant",
        content: aiContent,
        model: "gemini-3.1-flash-lite-preview",
        provider: "google",
        inputTokens: response.response_metadata?.tokenUsage?.promptTokens || 0,
        outputTokens: response.response_metadata?.tokenUsage?.completionTokens || 0,
        totalTokens: response.response_metadata?.tokenUsage?.totalTokens || 0,
        sequence: nextSequence + 1,
        questionId: userMessage.messageId // Link answer to the question
      },
    });

    return sendResponse(res, 200, "AI response generated successfully", aiContent);

  } catch (error) {
    console.log(error.message)
    return sendResponse(res, 500, "Failed to generate AI response", { error: error.message });
  }
}

/**
 * @desc    Stream AI response
 * @route   POST /api/ai/stream
 * @access  Private
 */
export const stream = async (req, res) => {
  try {
    const { threadId, message } = req.body;

    if (!message) return sendResponse(res, 400, "Message is required");
    if (!threadId) return sendResponse(res, 400, "Thread is required");

    const threadData = await prisma.thread.findUnique({
      where: { threadId },
      include: { systemPrompt: true },
    });
    if (!threadData) return sendResponse(res, 400, "Thread not found");

    let promptText = threadData.systemPrompt?.prompt;
    if (!promptText) {
      const fallback = await prisma.systemPrompt.findFirst({
        where: { name: "AI chat" },
      });
      promptText = fallback?.prompt;
    }
    if (!promptText) {
      return sendResponse(res, 400, "No system prompt linked to this thread");
    }

    const existingMessages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { sequence: "asc" }
    });

    const nextSequence = existingMessages.length + 1;

    // Save User message
    const userMessage = await prisma.message.create({
      data: {
        threadId,
        role: "user",
        content: message,
        model: "gemini-3.1-flash-lite-preview",
        provider: "google",
        sequence: nextSequence
      }
    });

    // Limit to last 10 messages for context
    const historyMessages = existingMessages.slice(-10);

    const formattedMessages = [
      ...historyMessages.map(m =>
        m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content)
      ),
      new HumanMessage(message)
    ];

    // SSE Setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const responseStream = await streamMessage(
      promptText,
      formattedMessages,
      "google",
      "gemini-3.1-flash-lite-preview"
    );

    let fullContent = "";

    for await (const chunk of responseStream) {
      const content = chunk?.content || "";
      fullContent += content;

      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    // Manual token calculation using gpt-tokenizer (fallback)
    const tokenPromptText = promptText + " " + formattedMessages.map(m => m.content).join(" ");
    const manualInputTokens = encode(tokenPromptText).length;
    const manualOutputTokens = encode(fullContent).length;

    const inputTokens = manualInputTokens;
    const outputTokens = manualOutputTokens;

    // Save AI response to DB after stream ends
    await prisma.message.create({
      data: {
        threadId,
        role: "assistant",
        content: fullContent,
        model: "gemini-3.1-flash-lite-preview",
        provider: "google",
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        sequence: nextSequence + 1,
        questionId: userMessage.messageId
      },
    });

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (error) {
    console.error("Stream error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

/**
 * @desc    Get total token usage for a thread
 * @route   GET /api/ai/thread/:threadId/usage
 * @access  Private
 */
export const getThreadUsage = async (req, res) => {
  try {
    const { threadId } = req.params;

    if (!threadId) {
      return sendResponse(res, 400, "Thread ID is required");
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      select: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        sequence: true,
        createdAt: true
      },
      orderBy: { sequence: 'asc' }
    });

    const history = messages
      .filter(m => (m.inputTokens && m.inputTokens > 0) || (m.outputTokens && m.outputTokens > 0))
      .map(m => ({
        sequence: m.sequence,
        inputTokens: m.inputTokens || 0,
        outputTokens: m.outputTokens || 0,
        totalTokens: m.totalTokens || 0,
        createdAt: m.createdAt
      }));

    const totalUsage = messages.reduce((acc, msg) => {
      acc.inputTokens += msg.inputTokens || 0;
      acc.outputTokens += msg.outputTokens || 0;
      acc.totalTokens += msg.totalTokens || 0;
      return acc;
    }, { inputTokens: 0, outputTokens: 0, totalTokens: 0 });
    
    totalUsage.history = history;

    return sendResponse(res, 200, "Thread usage fetched successfully", totalUsage);
  } catch (error) {
    console.error("getThreadUsage error:", error);
    return sendResponse(res, 500, "Failed to fetch thread usage", { error: error.message });
  }
};

/**
 * @desc    Tailor resume based on job description
 * @route   POST /api/ai/optimize-resume
 * @access  Private
 */
export const tailorResume = async (req, res) => {
  try {
    const { resumeData, jobDescription, sections = ['all'] } = req.body;

    if (!resumeData) {
      return sendResponse(res, 400, "Resume data is required");
    }

    if (!jobDescription) {
      return sendResponse(res, 400, "Job description is required");
    }

    if (!Array.isArray(sections) || sections.length === 0) {
      return sendResponse(res, 400, "At least one section must be selected");
    }

    // Helper to get section labels for the prompt
    const sectionLabels = {
      'all': 'Entire Resume',
      'basics.aboutMe': 'About Me / Summary',
      'experience': 'Professional Experience',
      'projects': 'Projects',
      'skills': 'Skills'
    };

    const targetSectionsText = sections.map(s => sectionLabels[s] || s).join(", ");

    // Prepare message for LangChain
    const prompt = `
      You are an expert Resume Writer and Career Coach. 
      Your task is to tailor the following sections of the resume to match the given Job Description perfectly: ${targetSectionsText}.

      ### Instructions:
      1. Analyze the Job Description (JD) to extract key requirements, skills, and industry-standard keywords.
      2. For each requested section:
         - 'basics.aboutMe': Rewrite it to align with the JD goals.
         - 'experience': Re-phrase bullet points to emphasize relevant skills and accomplishments. Use high-impact action verbs.
         - 'projects': Optimize project descriptions to highlight JD-relevant skills.
         - 'skills': Suggest additions to the array that are relevant to the JD but not yet included.
         - 'all': Apply optimizations to all major sections (Summary, Experience, Projects, Skills).
      3. DO NOT invent false information. Only highlight and rephrase existing data more effectively.
      4. **IMPORTANT**: Return ONLY a valid JSON object where keys are the section names and values are the optimized data for those sections.
         - For example: {"basics.aboutMe": "Optimized text...", "skills": ["Skill1", "Skill2"]}
      5. The structure for each section's value must exactly match its input structure.
      6. Do not include any markdown formatting, backticks, or explanation.
    `;

    const userMessage = new HumanMessage(`
      ### Section Data:
      ${JSON.stringify(resumeData, null, 2)}

      ### Job Description:
      ${jobDescription}
    `);

    const response = await generateMessage(
      prompt,
      [userMessage],
      "google",
      "gemini-3.1-flash-lite-preview"
    );

    let aiContent = typeof response.content === 'string'
      ? response.content
      : (Array.isArray(response.content) && response.content.length === 0
        ? ""
        : JSON.stringify(response.content));

    // Clean any potential markdown backticks from AI response
    if (aiContent.includes("```")) {
      aiContent = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    let tailoredData;
    try {
      tailoredData = JSON.parse(aiContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", aiContent);
      return sendResponse(res, 500, "AI generated an invalid response. Please try again.");
    }

    return sendResponse(res, 200, "Resume tailored successfully", tailoredData);

  } catch (error) {
    console.error("tailorResume error:", error);
    return sendResponse(res, 500, "Failed to tailor resume", { error: error.message });
  }
};

/**
 * @desc    Generate outreach message (Email, LinkedIn, WhatsApp) based on resume and JD
 * @route   POST /api/ai/generate-outreach
 * @access  Private
 */
export const generateOutreach = async (req, res) => {
  try {
    const { resumeData, jobDescription, platform = 'email' } = req.body;

    if (!resumeData) {
      return sendResponse(res, 400, "Resume data is required");
    }

    if (!jobDescription) {
      return sendResponse(res, 400, "Job description is required");
    }

    const platformGuidelines = {
      'email': 'Write a professional email (subject and body). Keep it formal but engaging. Highlight top 2-3 relevant skills.',
      'linkedin': 'Write a concise, professional LinkedIn connection request message or InMail (under 300 characters if a connection note, slightly longer for InMail). Focus on mutual value.',
      'whatsapp': 'Write a semi-formal, direct, and concise WhatsApp message. Keep it short and friendly but professional.'
    };

    const targetGuideline = platformGuidelines[platform.toLowerCase()] || platformGuidelines['email'];

    const prompt = `
      You are an expert Career Coach and Networking Specialist. 
      Your task is to draft an outreach message for a candidate aiming to connect with a recruiter or hiring manager for the specified Job Description.
      
      ### Message Platform: ${platform}
      ### Guidelines: ${targetGuideline}

      Instructions:
      1. Analyze the candidate's Resume Data and the targeted Job Description.
      2. Identify the most compelling overlap between the candidate's skills and the job's requirements.
      3. Draft the message appropriately for the selected platform format.
      4. DO NOT invent false information. Use only details present in the resume.
      5. Return ONLY the drafted message text (for email, include the subject and body). Do not include any extra commentary, markdown, or JSON formatting unless required by the text itself.
    `;

    const userMessage = new HumanMessage(`
      ### Candidate Resume:
      ${JSON.stringify(resumeData, null, 2)}

      ### Job Description:
      ${jobDescription}
    `);

    const response = await generateMessage(
      prompt,
      [userMessage],
      "google",
      "gemini-3.1-flash-lite-preview"
    );

    let generatedMessage = response.content || "";
    // Clean markdown if present
    generatedMessage = generatedMessage.replace(/^```[\s\S]*?\n/g, "").replace(/```$/g, "").trim();

    return sendResponse(res, 200, "Outreach message generated successfully", { message: generatedMessage });

  } catch (error) {
    console.error("generateOutreach error:", error);
    return sendResponse(res, 500, "Failed to generate outreach message", { error: error.message });
  }
};