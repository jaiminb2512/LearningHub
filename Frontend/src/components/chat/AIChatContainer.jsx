import React, { useState, useRef, useEffect } from "react";
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
} from "@mui/material";

import {
  Send as SendIcon,
  SmartToy as RobotIcon,
  Person as PersonIcon,
  DeleteOutline as ClearIcon,
  AutoAwesome as SparklesIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  InfoOutlined as InfoIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  Stop as StopIcon,
} from "@mui/icons-material";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import aiService from "../../services/aiService";
import threadService from "../../services/threadService";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

/* ---------------- CODE BLOCK ---------------- */

const CodeBlock = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = React.useState(false);

  const match = /language-(\w+)/.exec(className || "");

  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code
        {...props}
        style={{
          backgroundColor: "rgba(0,0,0,0.08)",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "0.85rem",
        }}
      >
        {children}
      </code>
    );
  }

  return match ? (
    <Box sx={{ position: "relative", my: 1.5 }}>
      <Box sx={{ position: "absolute", top: 6, right: 6, zIndex: 2 }}>
        <Tooltip title={copied ? "Copied!" : "Copy Code"}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: "grey.300",
              bgcolor: "rgba(255,255,255,0.05)",
            }}
          >
            {copied ? (
              <CheckIcon fontSize="small" />
            ) : (
              <CopyIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "20px 16px",
          fontSize: "0.85rem",
          borderRadius: 8,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  ) : (
    <pre>
      <code>{children}</code>
    </pre>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

const AIChatContainer = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  // Speech to Text (STT) & Text to Speech (TTS) States
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);

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
      if (!chatId) return;

      try {
        const res = await threadService.getThreadById(chatId);

        if (res.data?.messages) {
          const mapped = res.data.messages.map((m) => ({
            id: m.messageId,
            text: m.content,
            sender: m.role === "assistant" ? "ai" : "user",
            timestamp: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

          setMessages(mapped);
        }
      } catch (err) {
        console.error("Thread load error", err);
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

    const abortController = new AbortController();

    try {
      const aiMsgId = Date.now() + 1;
      let fullText = "";
      let displayedText = "";
      let isStreaming = true;
      let messageAdded = false;
      let updateInterval = null;

      await aiService.stream(chatId, text, (chunk) => {
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
      }, abortController.signal);

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

  const handleClearChat = () => setMessages([]);

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
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <RobotIcon sx={{ fontSize: 20, color: "primary.main" }} />
          Learning Bot
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
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

            return (
              <Box
                key={msg.id}
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  py: 3,
                  px: 2,
                  bgcolor: isUser ? "transparent" : "action.hover",
                  borderBottom: isUser ? "none" : 1,
                  borderColor: "divider",
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
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "4px",
                      bgcolor: isUser ? "primary.main" : "secondary.main",
                      fontSize: "0.9rem",
                    }}
                  >
                    {isUser ? (
                      <PersonIcon fontSize="small" />
                    ) : (
                      <RobotIcon fontSize="small" />
                    )}
                  </Avatar>

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
                      {isUser ? "You" : "Learning Bot"}
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
                            onClick={() => speakText(msg.text, msg.id)}
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
                  Learning Bot
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
              placeholder="Message Learning Bot..."
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
              
              {usageData.history && usageData.history.length > 0 && (
                <Box sx={{ mt: 4, height: 250 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Token Usage History</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={usageData.history}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="sequence" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="inputTokens"
                        name="Input Tokens"
                        stackId="1"
                        stroke="#9c27b0"
                        fill="#9c27b0"
                        fillOpacity={0.4}
                      />
                      <Area
                        type="monotone"
                        dataKey="outputTokens"
                        name="Output Tokens"
                        stackId="1"
                        stroke="#1976d2"
                        fill="#1976d2"
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
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
