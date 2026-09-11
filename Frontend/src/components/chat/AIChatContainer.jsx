import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  MenuItem,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  Slider,
  Switch,
  Divider,
} from "@mui/material";

import {
  Send as SendIcon,
  SmartToy as RobotIcon,
  Person as PersonIcon,
  DeleteOutline as ClearIcon,
  AutoAwesome as SparklesIcon,
  InfoOutlined as InfoIcon,
  DescriptionOutlined as PromptViewIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  MenuBook as BookIcon,
  SwapVert as MessageDetailIcon,
} from "@mui/icons-material";

import aiService from "../../services/aiService";
import threadService from "../../services/threadService";
import { systemPromptService } from "../../services/systemPromptService";
import aiSettingService, { DEFAULT_AI_SETTINGS_FORM } from "../../services/aiSettingService";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./LazyCodeBlock";
import ChatBooksPanel from "./ChatBooksPanel";
import ChatMessageDetailPanel from "./ChatMessageDetailPanel";

const UsageHistoryChart = lazy(() => import("./UsageHistoryChart"));

const settingsFormFromJson = (json = {}) => ({
  temperature: json.temperature ?? DEFAULT_AI_SETTINGS_FORM.temperature,
  maxOutputTokens: json.maxOutputTokens ?? DEFAULT_AI_SETTINGS_FORM.maxOutputTokens,
  ragEnabled: json.ragEnabled !== false,
  model: json.model || DEFAULT_AI_SETTINGS_FORM.model,
  provider: json.provider || DEFAULT_AI_SETTINGS_FORM.provider,
});

/* ---------------- MAIN COMPONENT ---------------- */

const AIChatContainer = ({ chatId, showChatHeader = true }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(Boolean(chatId));
  const [showUsage, setShowUsage] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [currentAiSetting, setCurrentAiSetting] = useState(null);
  const [lastTurnPrompt, setLastTurnPrompt] = useState("");
  const [showPromptPanel, setShowPromptPanel] = useState(false);
  const [promptPanelWidth, setPromptPanelWidth] = useState(400);
  const [showBooksPanel, setShowBooksPanel] = useState(false);
  const [booksPanelWidth, setBooksPanelWidth] = useState(420);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [messagePanelWidth, setMessagePanelWidth] = useState(420);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [messageDetails, setMessageDetails] = useState(null);
  const [messageDetailsLoading, setMessageDetailsLoading] = useState(false);
  const [messageDetailsError, setMessageDetailsError] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptForm, setPromptForm] = useState({
    name: "",
    prompt: "",
  });
  const [showAiSettingDialog, setShowAiSettingDialog] = useState(false);
  const [aiSettingsList, setAiSettingsList] = useState([]);
  const [aiProviders, setAiProviders] = useState([]);
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);
  const [selectedAiSettingId, setSelectedAiSettingId] = useState("");
  const [aiSettingForm, setAiSettingForm] = useState({ ...DEFAULT_AI_SETTINGS_FORM });
  const [aiSettingSaving, setAiSettingSaving] = useState(false);

  // Speech to Text (STT) & Text to Speech (TTS) States
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const recognitionRef = useRef(null);
  const isResizingPrompt = useRef(false);
  const isResizingBooks = useRef(false);
  const isResizingMessage = useRef(false);
  const pendingAiInputRef = useRef("");

  const messagesEndRef = useRef(null);
  const layoutRef = useRef(null);

  const maxWidth = "1024px";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  /* ---------------- SPEECH TO TEXT (STT) ---------------- */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputValue((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech start error:", err);
      }
    }
  };

  /* ---------------- TEXT TO SPEECH (TTS) ---------------- */
  const speakText = (text, messageId) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported on this computer/browser.");
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active utterance
    const cleanText = text
      .replace(/```[\s\S]*?```/g, " code snippet omitted ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[#*_~>]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Select natural English voice if available (matching Interview platform)
    const voices = window.speechSynthesis.getVoices() || [];
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                         voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online'))) ||
                         voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };


  /* ---------------- LOAD THREAD ---------------- */

  useEffect(() => {
    const fetchThread = async () => {
      if (!chatId) {
        setIsLoadingThread(false);
        return;
      }

      setIsLoadingThread(true);
      try {
        const res = await threadService.getThreadById(chatId);
        setCurrentPrompt(res.data?.systemPrompt || null);
        setCurrentAiSetting(res.data?.aiSetting || null);
        setLastTurnPrompt("");

        if (res.data?.messages) {
          const mapped = res.data.messages.map((m) => ({
            id: m.messageId,
            text: m.content,
            sender: m.role === "assistant" ? "ai" : "user",
            timestamp: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            model: m.model || null,
            provider: m.provider || null,
            inputTokens: m.inputTokens ?? null,
            outputTokens: m.outputTokens ?? null,
            totalTokens: m.totalTokens ?? null,
            questionId: m.questionId || null,
          }));

          setMessages(mapped);
          setSelectedMessageId(null);
        } else {
          setMessages([]);
          setSelectedMessageId(null);
        }
      } catch (err) {
        console.error("Thread load error", err);
      } finally {
        setIsLoadingThread(false);
      }
    };

    fetchThread();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /* ---------------- SEND MESSAGE ---------------- */

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const text = inputValue.trim();

    const userMsg = {
      id: Date.now(),
      text,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    pendingAiInputRef.current = "";

    const abortController = new AbortController();

    try {
      const aiMsgId = Date.now() + 1;
      let fullText = "";
      let displayedText = "";
      let isStreaming = true;
      let messageAdded = false;
      let updateInterval = null;

      await aiService.stream(
        chatId,
        text,
        (chunk) => {
        // Hide thinking indicator and add message on first chunk
        if (!messageAdded) {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              text: "",
              sender: "ai",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isStreaming: true,
              aiInput: pendingAiInputRef.current || "",
            },
          ]);
          messageAdded = true;

          // Start smooth typing interval
          updateInterval = setInterval(() => {
            if (displayedText.length < fullText.length) {
              const diff = fullText.length - displayedText.length;
              const increment = Math.max(1, Math.ceil(diff * 0.15));
              displayedText = fullText.substring(0, displayedText.length + increment);

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, text: displayedText } : msg
                )
              );
            } else if (!isStreaming) {
              clearInterval(updateInterval);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
                )
              );
            }
          }, 25);
        }

        fullText += chunk;
      },
        abortController.signal,
        (event) => {
          if (event?.type === "prompt" && event.prompt) {
            setLastTurnPrompt(event.prompt);
            pendingAiInputRef.current = event.prompt;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId || (msg.sender === "ai" && msg.isStreaming)
                  ? { ...msg, aiInput: event.prompt }
                  : msg
              )
            );
          }
        }
      );

      isStreaming = false;
      // If the stream was empty or finished too fast, ensure interval clears
      if (!messageAdded) setIsTyping(false);

    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Stream error", err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "AI error occurred",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setSelectedMessageId(null);
    setShowMessagePanel(false);
    setMessageDetails(null);
    setMessageDetailsError("");
  };

  const handleOpenUsage = async () => {
    if (!chatId) return;
    setShowUsage(true);
    setIsLoadingUsage(true);
    try {
      const res = await aiService.getThreadUsage(chatId);
      setUsageData(res.data);
    } catch (err) {
      console.error("Usage fetch error", err);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  useEffect(() => {
    const onMove = (e) => {
      if (isResizingPrompt.current) {
        const maxW = Math.min(720, Math.floor(window.innerWidth * 0.7));
        const next = Math.min(Math.max(window.innerWidth - e.clientX, 280), maxW);
        setPromptPanelWidth(next);
      }
      if (isResizingBooks.current) {
        const maxW = Math.min(720, Math.floor(window.innerWidth * 0.7));
        const next = Math.min(Math.max(window.innerWidth - e.clientX, 280), maxW);
        setBooksPanelWidth(next);
      }
      if (isResizingMessage.current) {
        const maxW = Math.min(720, Math.floor(window.innerWidth * 0.7));
        const left = layoutRef.current?.getBoundingClientRect().left ?? 0;
        const next = Math.min(Math.max(e.clientX - left, 280), maxW);
        setMessagePanelWidth(next);
      }
    };
    const onUp = () => {
      if (isResizingPrompt.current || isResizingBooks.current || isResizingMessage.current) {
        isResizingPrompt.current = false;
        isResizingBooks.current = false;
        isResizingMessage.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleTogglePromptPanel = () => {
    if (!currentPrompt?.systemPromptId) return;
    if (showPromptPanel) {
      if (promptSaving) return;
      setShowPromptPanel(false);
      return;
    }
    setShowBooksPanel(false);
    setPromptForm({
      name: currentPrompt?.name || "",
      prompt: currentPrompt?.prompt || "",
    });
    setShowPromptPanel(true);
  };

  const handleClosePromptPanel = () => {
    if (promptSaving) return;
    setShowPromptPanel(false);
  };

  const handleToggleBooksPanel = () => {
    if (showBooksPanel) {
      setShowBooksPanel(false);
      return;
    }
    setShowPromptPanel(false);
    setShowBooksPanel(true);
  };

  const handleToggleMessagePanel = () => {
    if (showMessagePanel) {
      setShowMessagePanel(false);
      return;
    }
    if (!selectedMessageId && messages.length > 0) {
      const lastUser = [...messages].reverse().find((m) => m.sender === "user");
      setSelectedMessageId(lastUser?.id || messages[messages.length - 1].id);
    }
    setShowMessagePanel(true);
  };

  const handleSelectUserMessage = (messageId) => {
    setSelectedMessageId(messageId);
    setShowMessagePanel(true);
  };

  useEffect(() => {
    const fetchMessageDetails = async () => {
      if (!showMessagePanel || !chatId || !selectedMessageId) {
        return;
      }

      // Temp client-side ids (Date.now) are not in DB yet
      if (typeof selectedMessageId === "number" || String(selectedMessageId).length < 30) {
        const selected = messages.find((m) => m.id === selectedMessageId);
        const index = messages.findIndex((m) => m.id === selectedMessageId);
        const aiMsg =
          selected?.sender === "user"
            ? messages.slice(index + 1).find((m) => m.sender === "ai") || null
            : selected;
        const userMsg =
          selected?.sender === "user"
            ? selected
            : [...messages].slice(0, index).reverse().find((m) => m.sender === "user") || null;

        setMessageDetails({
          userInput: userMsg?.text || "",
          aiInput: aiMsg?.aiInput || lastTurnPrompt || "",
          aiOutput: aiMsg?.text || "",
          model: aiMsg?.model || null,
          provider: aiMsg?.provider || null,
          inputTokens: aiMsg?.inputTokens ?? null,
          outputTokens: aiMsg?.outputTokens ?? null,
          totalTokens: aiMsg?.totalTokens ?? null,
          aiSetting: currentAiSetting,
        });
        setMessageDetailsError("");
        setMessageDetailsLoading(false);
        return;
      }

      setMessageDetailsLoading(true);
      setMessageDetailsError("");
      try {
        const res = await threadService.getMessageDetails(chatId, selectedMessageId);
        setMessageDetails(res.data || null);
      } catch (err) {
        console.error("Message details fetch error", err);
        setMessageDetails(null);
        setMessageDetailsError(err?.response?.data?.message || "Failed to load message details");
      } finally {
        setMessageDetailsLoading(false);
      }
    };

    fetchMessageDetails();
  }, [
    showMessagePanel,
    chatId,
    selectedMessageId,
    messages,
    lastTurnPrompt,
    currentAiSetting,
  ]);

  const handleStartResizePrompt = (e) => {
    e.preventDefault();
    isResizingPrompt.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleStartResizeBooks = (e) => {
    e.preventDefault();
    isResizingBooks.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleStartResizeMessage = (e) => {
    e.preventDefault();
    isResizingMessage.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleSavePrompt = async () => {
    if (!currentPrompt?.systemPromptId || promptSaving) return;

    const payload = {
      name: promptForm.name.trim(),
      prompt: promptForm.prompt.trim(),
    };

    if (!payload.name || !payload.prompt) return;

    setPromptSaving(true);
    try {
      const response = await systemPromptService.update(currentPrompt.systemPromptId, payload);
      setCurrentPrompt(response.data || null);
    } catch (err) {
      console.error("System prompt update error", err);
    } finally {
      setPromptSaving(false);
    }
  };

  const handleOpenAiSettingDialog = async () => {
    if (!chatId) return;
    setShowAiSettingDialog(true);
    setSelectedAiSettingId(currentAiSetting?.aiSettingId || "");
    setAiSettingForm(settingsFormFromJson(currentAiSetting?.settingsJson));
    setAiSettingsLoading(true);
    try {
      const [settingsRes, providersRes] = await Promise.all([
        aiSettingService.getAll({ page: 1, limit: 100 }),
        aiService.getProviders(),
      ]);
      if (settingsRes.success === 200) {
        setAiSettingsList(settingsRes.data?.settings || []);
      }
      if (providersRes.success === 200) {
        setAiProviders(providersRes.data || []);
      }
    } catch (err) {
      console.error("AI settings load error", err);
    } finally {
      setAiSettingsLoading(false);
    }
  };

  const handleSelectAiSettingPreset = (aiSettingId) => {
    setSelectedAiSettingId(aiSettingId);
    if (!aiSettingId) {
      setAiSettingForm({ ...DEFAULT_AI_SETTINGS_FORM });
      return;
    }
    const preset = aiSettingsList.find((s) => s.aiSettingId === aiSettingId);
    setAiSettingForm(settingsFormFromJson(preset?.settingsJson));
  };

  const handleSaveAiSetting = async () => {
    if (!chatId || aiSettingSaving) return;

    const nextId = selectedAiSettingId || null;
    if (!nextId) {
      // Clear association → defaults on next message
      setAiSettingSaving(true);
      try {
        const response = await threadService.updateThread(chatId, { aiSettingId: null });
        if (response.success === 200) {
          setCurrentAiSetting(null);
          setShowAiSettingDialog(false);
        }
      } catch (err) {
        console.error("AI setting update error", err);
      } finally {
        setAiSettingSaving(false);
      }
      return;
    }

    setAiSettingSaving(true);
    try {
      const currentId = currentAiSetting?.aiSettingId || null;
      if (nextId !== currentId) {
        const threadRes = await threadService.updateThread(chatId, { aiSettingId: nextId });
        if (threadRes.success !== 200) return;
      }

      const preset = aiSettingsList.find((s) => s.aiSettingId === nextId);
      const updateRes = await aiSettingService.update(nextId, {
        name: preset?.name || currentAiSetting?.name || "Chat settings",
        settingsJson: {
          temperature: Number(aiSettingForm.temperature),
          maxOutputTokens: Number(aiSettingForm.maxOutputTokens),
          ragEnabled: Boolean(aiSettingForm.ragEnabled),
          model: aiSettingForm.model,
          provider: aiSettingForm.provider,
        },
      });

      if (updateRes.success === 200 || updateRes.success === 201) {
        setCurrentAiSetting(updateRes.data || null);
        setAiSettingsList((prev) =>
          prev.map((s) => (s.aiSettingId === nextId ? updateRes.data : s))
        );
        setShowAiSettingDialog(false);
      }
    } catch (err) {
      console.error("AI setting update error", err);
    } finally {
      setAiSettingSaving(false);
    }
  };

  const aiModelOptions = aiProviders.flatMap((provider) =>
    (provider.models || []).map((model) => ({
      providerId: provider.id,
      providerName: provider.name,
      modelId: model.id,
      modelName: model.name,
    }))
  );

  const canSavePrompt = Boolean(promptForm.name.trim() && promptForm.prompt.trim());
  const canEditAiOptions = Boolean(selectedAiSettingId);

  if (isLoadingThread) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.paper",
        }}
      >
        <CircularProgress size={36} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        color: "text.primary",
        fontFamily: "inherit",
      }}
    >
      {/* HEADER */}
      {showChatHeader ? (
      <Box
        sx={{
          p: 1.5,
          px: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(30, 30, 30, 0.8)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <RobotIcon sx={{ fontSize: 20, color: "primary.main" }} />
            LearningHub
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: { xs: 180, sm: 420 } }}>
            {currentPrompt?.name ? `Prompt: ${currentPrompt.name}` : "No system prompt selected"}
            {currentAiSetting?.name ? ` · Settings: ${currentAiSetting.name}` : " · Settings: Default"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title={showMessagePanel ? "Hide message details" : "Message input / output"}>
            <IconButton
              onClick={handleToggleMessagePanel}
              size="small"
              color="primary"
              sx={showMessagePanel ? { bgcolor: "action.selected" } : undefined}
            >
              <MessageDetailIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={showPromptPanel ? "Hide system prompt" : "System prompt"}>
            <span>
              <IconButton
                onClick={handleTogglePromptPanel}
                size="small"
                color="primary"
                disabled={!currentPrompt?.systemPromptId}
                sx={showPromptPanel ? { bgcolor: "action.selected" } : undefined}
              >
                <PromptViewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={showBooksPanel ? "Hide books" : "Books & notes"}>
            <IconButton
              onClick={handleToggleBooksPanel}
              size="small"
              color="primary"
              sx={showBooksPanel ? { bgcolor: "action.selected" } : undefined}
            >
              <BookIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Change AI settings">
            <IconButton
              onClick={handleOpenAiSettingDialog}
              size="small"
              color="primary"
              disabled={!chatId}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear chat">
            <IconButton onClick={handleClearChat} size="small">
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Token usage information">
            <IconButton onClick={handleOpenUsage} size="small" color="primary">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      ) : null}

      <Box ref={layoutRef} sx={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        {showMessagePanel ? (
          <ChatMessageDetailPanel
            width={messagePanelWidth}
            onClose={() => setShowMessagePanel(false)}
            onStartResize={handleStartResizeMessage}
            loading={messageDetailsLoading}
            error={messageDetailsError}
            inputText={messageDetails?.userInput || ""}
            aiInputText={messageDetails?.aiInput || ""}
            outputText={messageDetails?.aiOutput || ""}
            aiSetting={messageDetails?.aiSetting || currentAiSetting}
            messageMeta={{
              model: messageDetails?.model,
              provider: messageDetails?.provider,
              inputTokens: messageDetails?.inputTokens,
              outputTokens: messageDetails?.outputTokens,
              totalTokens: messageDetails?.totalTokens,
            }}
          />
        ) : null}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
      {/* MESSAGES */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          pb: 4,
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "divider",
            borderRadius: "10px",
          },
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              opacity: 0.5,
              mt: "20vh",
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: "action.hover",
                color: "text.disabled",
              }}
            >
              <RobotIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={600}>
              How can I help you today?
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === "user";
            const isSelected = isUser && selectedMessageId === msg.id;

            return (
              <Box
                key={msg.id}
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  py: 3,
                  px: 2,
                  bgcolor: isSelected
                    ? "action.selected"
                    : isUser
                      ? "transparent"
                      : "action.hover",
                  borderBottom: isUser ? "none" : 1,
                  borderColor: "divider",
                  outline: isSelected ? "2px solid" : "none",
                  outlineColor: "primary.main",
                  outlineOffset: -2,
                  transition: "background-color 0.15s",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: maxWidth,
                    display: "flex",
                    gap: 3,
                  }}
                >
                  {isUser ? (
                    <Tooltip title="View message details">
                      <Avatar
                        onClick={() => handleSelectUserMessage(msg.id)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "4px",
                          bgcolor: "primary.main",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          flexShrink: 0,
                          outline: isSelected ? "2px solid" : "none",
                          outlineColor: "primary.light",
                          outlineOffset: 2,
                          "&:hover": { opacity: 0.9, boxShadow: 2 },
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    </Tooltip>
                  ) : (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "4px",
                        bgcolor: "secondary.main",
                        fontSize: "0.9rem",
                        flexShrink: 0,
                      }}
                    >
                      <RobotIcon fontSize="small" />
                    </Avatar>
                  )}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        mb: 0.5,
                        color: "text.primary",
                        textTransform: "capitalize",
                      }}
                    >
                      {isUser ? "You" : "LearningHub"}
                    </Typography>

                    {isUser ? (
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.6,
                          color: "text.primary",
                        }}
                      >
                        {msg.text}
                      </Typography>
                    ) : (
                      <Box
                        sx={{
                          "& p": {
                            mt: 0,
                            mb: 1.5,
                            lineHeight: 1.6,
                            color: "text.primary",
                          },
                          "& p:last-child": { mb: 0 },
                          "& h1, & h2, & h3, & h4": {
                            mt: 3,
                            mb: 1.5,
                            color: "text.primary",
                            fontWeight: 700,
                            lineHeight: 1.3,
                          },
                          "& h1:first-of-type, & h2:first-of-type, & h3:first-of-type":
                          {
                            mt: 0,
                          },
                          "& pre": {
                            my: 2,
                            borderRadius: "8px",
                            overflow: "hidden",
                          },
                          "& code": { fontFamily: "'Fira Code', monospace" },
                          "& ul, & ol": { mt: 0, mb: 1.5, pl: 3.5 },
                          "& ul:last-child, & ol:last-child": { mb: 0 },
                          "& li": { mb: 0.75 },
                          "& li > p": { mb: 0.5 },
                          "& hr": {
                            my: 3,
                            border: "none",
                            borderBottom: 1,
                            borderColor: "divider",
                          },
                          "& table": {
                            width: "100%",
                            borderCollapse: "collapse",
                            my: 2.5,
                            fontSize: "0.875rem",
                            border: 1,
                            borderColor: "divider",
                            borderRadius: "8px",
                            overflow: "hidden",
                          },
                          "& th": {
                            bgcolor: "action.hover",
                            px: 1.5,
                            py: 1.25,
                            textAlign: "left",
                            fontWeight: 700,
                            borderBottom: 1,
                            borderRight: 1,
                            borderColor: "divider",
                          },
                          "& td": {
                            px: 1.5,
                            py: 1,
                            borderBottom: 1,
                            borderRight: 1,
                            borderColor: "divider",
                            verticalAlign: "top",
                          },
                          "& tr:last-child td": {
                            borderBottom: "none",
                          },
                          "& th:last-child, & td:last-child": {
                            borderRight: "none",
                          },
                          "& tr:nth-of-type(even)": {
                            bgcolor: "action.selected",
                          },
                          // BLINKING CURSOR
                          ...(msg.isStreaming && {
                            "& p:last-child::after, & li:last-child::after": {
                              content: '"\u25CF"',
                              ml: 1,
                              fontSize: '0.8em',
                              color: 'primary.main',
                              animation: 'cursor-blink 1s infinite',
                              verticalAlign: 'middle',
                            },
                          }),
                          "@keyframes cursor-blink": {
                            "0%": { opacity: 0 },
                            "50%": { opacity: 1 },
                            "100%": { opacity: 0 },
                          }
                        }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: CodeBlock,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </Box>
                    )}

                    <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.7rem",
                        }}
                      >
                        {msg.timestamp}
                      </Typography>

                      {!isUser && msg.text && !msg.isStreaming && (
                        <Tooltip title={speakingMessageId === msg.id ? "Stop Listening" : "Read Aloud (TTS)"}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(msg.text, msg.id);
                            }}
                            sx={{
                              color: speakingMessageId === msg.id ? "primary.main" : "text.secondary",
                              bgcolor: speakingMessageId === msg.id ? "primary.lighter" : "transparent",
                              p: 0.5,
                              "&:hover": {
                                color: "primary.main",
                                bgcolor: "action.hover"
                              }
                            }}
                          >
                            {speakingMessageId === msg.id ? (
                              <StopIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <VolumeUpIcon sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}

        {isTyping && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              py: 4,
              px: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? "rgba(255, 255, 255, 0.02)"
                  : "rgba(0, 0, 0, 0.01)",
              borderBottom: 1,
              borderColor: "divider",
              animation: "fadeIn 0.3s ease-in-out",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "translateY(10px)" },
                to: { opacity: 1, transform: "translateY(0)" }
              }
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: maxWidth,
                display: "flex",
                gap: 3,
                alignItems: "flex-start",
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "4px",
                  bgcolor: "secondary.main",
                  boxShadow: (theme) => `0 0 15px ${theme.palette.secondary.main}44`,
                  animation: "pulseAvatar 2s infinite ease-in-out",
                  "@keyframes pulseAvatar": {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.05)", boxShadow: (theme) => `0 0 25px ${theme.palette.secondary.main}66` },
                    "100%": { transform: "scale(1)" }
                  }
                }}
              >
                <RobotIcon fontSize="small" />
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    mb: 1,
                    color: "text.primary",
                    textTransform: "capitalize",
                    letterSpacing: "0.5px"
                  }}
                >
                  LearningHub
                </Typography>

                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  px: 2,
                  width: "fit-content",
                  borderRadius: "12px",
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }}>
                  <CircularProgress
                    size={14}
                    thickness={6}
                    sx={{ color: "secondary.main" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontStyle: "italic",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5
                    }}
                  >
                    AI is processing your request
                    <Box component="span" sx={{
                      display: "flex",
                      gap: 0.3,
                      ml: 0.5,
                      "& span": {
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        bgcolor: "currentColor",
                        animation: "dotJump 1.4s infinite ease-in-out both",
                      },
                      "& span:nth-of-type(1)": { animationDelay: "-0.32s" },
                      "& span:nth-of-type(2)": { animationDelay: "-0.16s" },
                      "@keyframes dotJump": {
                        "0%, 80%, 100%": { transform: "scale(0)" },
                        "40%": { transform: "scale(1)" }
                      }
                    }}>
                      <span />
                      <span />
                      <span />
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}


        <div ref={messagesEndRef} />
      </Box>

      {/* INPUT AREA */}
      <Box
        sx={{
          p: 2,
          pb: 4,
          display: "flex",
          justifyContent: "center",
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: maxWidth,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "flex-end",
              p: "8px 12px",
              border: 1,
              borderColor: "divider",
              borderRadius: "12px",
              transition: "border-color 0.2s",
              "&:focus-within": {
                borderColor: "primary.main",
                boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main} inset`,
              },
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={8}
              placeholder="Message LearningHub..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: "1rem",
                  px: 1,
                  py: 0.5,
                  lineHeight: 1.5,
                },
              }}
            />

            <Tooltip title={isListening ? "Stop voice recording" : "Speech to Text (Mic)"}>
              <IconButton
                onClick={toggleListening}
                sx={{
                  bgcolor: isListening ? "error.main" : "action.hover",
                  color: isListening ? "white" : "text.secondary",
                  borderRadius: "8px",
                  p: 0.75,
                  mb: 0.25,
                  mr: 1,
                  animation: isListening ? "micPulse 1.5s infinite ease-in-out" : "none",
                  "@keyframes micPulse": {
                    "0%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.7)" },
                    "70%": { transform: "scale(1.1)", boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)" },
                    "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" }
                  },
                  "&:hover": {
                    bgcolor: isListening ? "error.dark" : "action.selected",
                    color: isListening ? "white" : "primary.main",
                  }
                }}
              >
                {isListening ? <MicOffIcon sx={{ fontSize: 20 }} /> : <MicIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            <IconButton
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              sx={{
                bgcolor: inputValue.trim() ? "primary.main" : "transparent",
                color: inputValue.trim() ? "primary.contrastText" : "text.disabled",
                borderRadius: "8px",
                p: 0.75,
                mb: 0.25,
                "&:hover": {
                  bgcolor: inputValue.trim() ? "primary.dark" : "transparent",
                },
                "&.Mui-disabled": {
                  color: "text.disabled",
                },
              }}
            >
              <SendIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Paper>
        </Box>
      </Box>
        </Box>

        {showBooksPanel ? (
          <ChatBooksPanel
            chatId={chatId}
            width={booksPanelWidth}
            onClose={() => setShowBooksPanel(false)}
            onStartResize={handleStartResizeBooks}
          />
        ) : null}

        {showPromptPanel ? (
          <>
            <Box
              onMouseDown={handleStartResizePrompt}
              sx={{
                width: 6,
                flexShrink: 0,
                cursor: "col-resize",
                bgcolor: "divider",
                transition: "background-color 0.15s",
                "&:hover": { bgcolor: "primary.main" },
              }}
            />
            <Box
              sx={{
                width: promptPanelWidth,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                borderLeft: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    System prompt
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {currentPrompt?.name || "Untitled"}
                  </Typography>
                </Box>
                <IconButton onClick={handleClosePromptPanel} size="small" disabled={promptSaving}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  px: 2,
                  py: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <TextField
                  label="Prompt name"
                  value={promptForm.name}
                  onChange={(e) => setPromptForm((prev) => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Prompt"
                  value={promptForm.prompt}
                  onChange={(e) => setPromptForm((prev) => ({ ...prev, prompt: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={12}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      fontSize: 13,
                      lineHeight: 1.5,
                    },
                  }}
                />

                {lastTurnPrompt ? (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Last turn full prompt (this session)
                      </Typography>
                      <TextField
                        value={lastTurnPrompt}
                        fullWidth
                        multiline
                        minRows={6}
                        InputProps={{ readOnly: true }}
                        sx={{
                          "& .MuiInputBase-input": {
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                            fontSize: 13,
                            lineHeight: 1.5,
                          },
                        }}
                      />
                    </Box>
                  </>
                ) : null}
              </Box>

              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                  gap: 1,
                  justifyContent: "flex-end",
                }}
              >
                <Button onClick={handleClosePromptPanel} disabled={promptSaving}>
                  Close
                </Button>
                <Button
                  onClick={handleSavePrompt}
                  variant="contained"
                  disableElevation
                  disabled={!canSavePrompt || promptSaving}
                >
                  {promptSaving ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Box>
          </>
        ) : null}
      </Box>

      {/* AI SETTINGS DIALOG */}
      <Dialog
        open={showAiSettingDialog}
        onClose={() => !aiSettingSaving && setShowAiSettingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6">Change AI settings</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {aiSettingsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 1 }}>
              <TextField
                select
                label="Saved settings"
                value={selectedAiSettingId}
                onChange={(e) => handleSelectAiSettingPreset(e.target.value)}
                fullWidth
                helperText={
                  canEditAiOptions
                    ? "Edits update this setting’s JSON for the next message"
                    : "Select a saved setting to edit options, or keep Default"
                }
              >
                <MenuItem value="">
                  <em>Default settings</em>
                </MenuItem>
                {aiSettingsList.map((setting) => (
                  <MenuItem key={setting.aiSettingId} value={setting.aiSettingId}>
                    {setting.name}
                  </MenuItem>
                ))}
              </TextField>

              {aiSettingsList.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No saved AI settings yet. Create some under Manage → AI Settings.
                </Typography>
              )}

              <FormControl fullWidth disabled={!canEditAiOptions}>
                <InputLabel id="runtime-model-label">Model</InputLabel>
                <Select
                  labelId="runtime-model-label"
                  label="Model"
                  value={aiSettingForm.model}
                  onChange={(e) => {
                    const modelId = e.target.value;
                    const match = aiModelOptions.find((m) => m.modelId === modelId);
                    setAiSettingForm((prev) => ({
                      ...prev,
                      model: modelId,
                      provider: match?.providerId || prev.provider,
                    }));
                  }}
                >
                  {aiModelOptions.map((m) => (
                    <MenuItem key={m.modelId} value={m.modelId}>
                      {m.providerName} — {m.modelName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography gutterBottom color={canEditAiOptions ? "text.primary" : "text.disabled"}>
                  Temperature: {Number(aiSettingForm.temperature).toFixed(2)}
                </Typography>
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  disabled={!canEditAiOptions}
                  value={Number(aiSettingForm.temperature)}
                  onChange={(_, value) =>
                    setAiSettingForm((prev) => ({ ...prev, temperature: value }))
                  }
                  valueLabelDisplay="auto"
                />
              </Box>

              <TextField
                label="Max output tokens"
                type="number"
                disabled={!canEditAiOptions}
                value={aiSettingForm.maxOutputTokens}
                onChange={(e) =>
                  setAiSettingForm((prev) => ({
                    ...prev,
                    maxOutputTokens: Number(e.target.value) || 0,
                  }))
                }
                fullWidth
                inputProps={{ min: 64, max: 8192 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(aiSettingForm.ragEnabled)}
                    disabled={!canEditAiOptions}
                    onChange={(e) =>
                      setAiSettingForm((prev) => ({
                        ...prev,
                        ragEnabled: e.target.checked,
                      }))
                    }
                  />
                }
                label="RAG enabled (store/search vectors)"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setShowAiSettingDialog(false)} disabled={aiSettingSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveAiSetting}
            variant="contained"
            disableElevation
            disabled={aiSettingsLoading || aiSettingSaving}
            sx={{ borderRadius: "8px" }}
          >
            {aiSettingSaving ? "Saving..." : "Apply"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOKEN USAGE DIALOG */}
      <Dialog open={showUsage} onClose={() => setShowUsage(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <InfoIcon color="primary" />
          <Typography variant="h6">Token Usage</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {isLoadingUsage ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : usageData ? (
            <Box sx={{ py: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase" }}>
                    Input Tokens
                  </Typography>
                  <Typography variant="h5" color="secondary.main" fontWeight={700}>
                    {usageData.inputTokens.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase" }}>
                    Output Tokens
                  </Typography>
                  <Typography variant="h5" color="primary.main" fontWeight={700}>
                    {usageData.outputTokens.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase" }}>
                      Total Tokens
                    </Typography>
                    <Typography variant="h4" fontWeight={800}>
                      {usageData.totalTokens.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {usageData.history?.length > 0 && (
                <Suspense
                  fallback={
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  }
                >
                  <UsageHistoryChart history={usageData.history} />
                </Suspense>
              )}

              <Typography variant="caption" sx={{ display: "block", mt: 3, fontStyle: "italic", opacity: 0.7 }}>
                * Token counts are calculated based on the entire conversation history in this thread.
              </Typography>
            </Box>
          ) : (
            <Typography color="error">Failed to load usage data.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setShowUsage(false)} variant="contained" disableElevation fullWidth sx={{ borderRadius: "8px" }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIChatContainer;
