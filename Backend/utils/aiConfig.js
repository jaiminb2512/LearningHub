export const AI_PROVIDERS = [
  {
    id: "google",
    name: "Google Gemini",
    models: [
      { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite Preview", isFree: true },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", isFree: false },
      { id: "gemini-3.1-flash-image-preview", name: "Gemini 3.1 Flash Image Preview", isFree: false },
      { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview", isFree: true },
      { id: "gemini-3-pro-image-preview", name: "Gemini 3 Pro Image Preview", isFree: false },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", isFree: true },
      { id: "gemini-3.1-flash-lite", name: "Gemini 2.5 Flash", isFree: true },
      { id: "gemini-3.1-flash-lite-lite", name: "Gemini 2.5 Flash Lite", isFree: true },
      { id: "gemini-3.1-flash-lite-lite-preview", name: "Gemini 2.5 Flash Lite", isFree: true },
      { id: "gemini-3.1-flash-lite-preview-tts", name: "Gemini 2.5 Flash preview tts", isFree: true },
      { id: "gemini-embedding-2-preview", name: "Gemini embedding 2 preview", isFree: true },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4", name: "GPT-4", isFree: false },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", isFree: false },
      { id: "gpt-4o", name: "GPT-4o", isFree: false },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", isFree: true },
    ],
  },
];