import prisma from "../dbConnect/prismaClient.js";
import { DEFAULT_AI_SETTINGS, normalizeAiSettings } from "../utils/aiConfig.js";

export class AiSettingServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AiSettingServiceError";
    this.statusCode = statusCode;
  }
}

export async function createAiSetting({ userId, name, settingsJson }) {
  const trimmedName = name?.trim();
  if (!trimmedName) {
    throw new AiSettingServiceError("Settings name is required", 400);
  }

  return prisma.aiSetting.create({
    data: {
      name: trimmedName,
      userId,
      settingsJson: normalizeAiSettings(settingsJson || DEFAULT_AI_SETTINGS),
    },
  });
}

export async function listAiSettings({ userId, page = 1, limit = 50 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;

  const where = { userId };
  const [settings, total] = await Promise.all([
    prisma.aiSetting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.aiSetting.count({ where }),
  ]);

  return {
    settings,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export async function getAiSetting({ userId, aiSettingId }) {
  const setting = await prisma.aiSetting.findFirst({
    where: { aiSettingId, userId },
  });
  if (!setting) {
    throw new AiSettingServiceError("AI setting not found", 404);
  }
  return setting;
}

export async function updateAiSetting({ userId, aiSettingId, name, settingsJson }) {
  await getAiSetting({ userId, aiSettingId });

  const data = {};
  if (name !== undefined) {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new AiSettingServiceError("Settings name is required", 400);
    }
    data.name = trimmed;
  }
  if (settingsJson !== undefined) {
    data.settingsJson = normalizeAiSettings(settingsJson);
  }

  return prisma.aiSetting.update({
    where: { aiSettingId },
    data,
  });
}

export async function deleteAiSetting({ userId, aiSettingId }) {
  await getAiSetting({ userId, aiSettingId });
  await prisma.aiSetting.delete({ where: { aiSettingId } });
  return { aiSettingId };
}

export async function resolveThreadAiSettings(thread) {
  const raw = thread?.aiSetting?.settingsJson;
  return normalizeAiSettings(raw || DEFAULT_AI_SETTINGS);
}
