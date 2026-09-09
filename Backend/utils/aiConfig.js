export const AI_PROVIDERS = [
  {
    id: "google",
    name: "Google Gemini",
    models: [
      { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite Preview" },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview" },
      { id: "gemini-3.1-flash-image-preview", name: "Gemini 3.1 Flash Image Preview" },
      { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview" },
      { id: "gemini-3-pro-image-preview", name: "Gemini 3 Pro Image Preview" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "gemini-3.1-flash-lite", name: "Gemini 2.5 Flash" },
      { id: "gemini-3.1-flash-lite-lite", name: "Gemini 2.5 Flash Lite" },
      { id: "gemini-3.1-flash-lite-lite-preview", name: "Gemini 2.5 Flash Lite" },
      { id: "gemini-3.1-flash-lite-preview-tts", name: "Gemini 2.5 Flash preview tts" },
      { id: "gemini-embedding-2-preview", name: "Gemini embedding 2 preview" },
    ],
  },
];

export const DEFAULT_AI_SETTINGS = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  ragEnabled: true,
  model: "gemini-3.1-flash-lite-preview",
  provider: "google",
};

export const normalizeAiSettings = (raw = {}) => {
  const temperature = Number(raw.temperature);
  const maxOutputTokens = Number(raw.maxOutputTokens);

  return {
    temperature: Number.isFinite(temperature)
      ? Math.min(2, Math.max(0, temperature))
      : DEFAULT_AI_SETTINGS.temperature,
    maxOutputTokens: Number.isFinite(maxOutputTokens)
      ? Math.min(8192, Math.max(64, Math.round(maxOutputTokens)))
      : DEFAULT_AI_SETTINGS.maxOutputTokens,
    ragEnabled: raw.ragEnabled !== false,
    model: typeof raw.model === "string" && raw.model.trim()
      ? raw.model.trim()
      : DEFAULT_AI_SETTINGS.model,
    provider: typeof raw.provider === "string" && raw.provider.trim()
      ? raw.provider.trim()
      : DEFAULT_AI_SETTINGS.provider,
  };
};
