import React from "react";
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  SwapVert as TurnIcon,
} from "@mui/icons-material";

const monoFieldSx = {
  "& .MuiInputBase-input": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 13,
    lineHeight: 1.5,
  },
};

const ChatMessageDetailPanel = ({
  width,
  onClose,
  onStartResize,
  loading = false,
  error = "",
  inputText,
  aiInputText,
  outputText,
  aiSetting,
  messageMeta,
}) => {
  const settings = aiSetting?.settingsJson || {};
  const settingName = aiSetting?.name || "Default";

  return (
    <>
      <Box
        sx={{
          width,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
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
          <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 1 }}>
            <TurnIcon color="primary" fontSize="small" />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                Message details
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Input, AI prompt, output & settings
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
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
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : !inputText && !outputText && !aiInputText ? (
            <Typography variant="body2" color="text.secondary">
              Click a user avatar to inspect that message’s input and output.
            </Typography>
          ) : (
            <>
              <TextField
                label="User input"
                value={inputText || ""}
                fullWidth
                multiline
                minRows={3}
                InputProps={{ readOnly: true }}
                sx={monoFieldSx}
              />
              <TextField
                label="AI input (full prompt)"
                value={aiInputText || ""}
                fullWidth
                multiline
                minRows={6}
                InputProps={{ readOnly: true }}
                sx={monoFieldSx}
              />
              <TextField
                label="AI output"
                value={outputText || ""}
                fullWidth
                multiline
                minRows={6}
                InputProps={{ readOnly: true }}
                sx={monoFieldSx}
              />
            </>
          )}

          {!loading && !error ? (
            <>
              <Divider />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <SettingsIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700}>
                  AI settings
                </Typography>
                <Chip label={settingName} size="small" sx={{ ml: 0.5 }} />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Provider
                  </Typography>
                  <Typography variant="body2">
                    {messageMeta?.provider || settings.provider || "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Model
                  </Typography>
                  <Typography variant="body2">
                    {messageMeta?.model || settings.model || "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Temperature
                  </Typography>
                  <Typography variant="body2">
                    {settings.temperature != null ? Number(settings.temperature).toFixed(2) : "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Max output tokens
                  </Typography>
                  <Typography variant="body2">
                    {settings.maxOutputTokens ?? "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    RAG
                  </Typography>
                  <Typography variant="body2">
                    {settings.ragEnabled === false ? "Off" : "On"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Tokens (in / out / total)
                  </Typography>
                  <Typography variant="body2">
                    {messageMeta?.inputTokens != null || messageMeta?.outputTokens != null
                      ? `${messageMeta?.inputTokens ?? 0} / ${messageMeta?.outputTokens ?? 0} / ${messageMeta?.totalTokens ??
                      (messageMeta?.inputTokens || 0) + (messageMeta?.outputTokens || 0)
                      }`
                      : "—"}
                  </Typography>
                </Box>
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
      <Box
        onMouseDown={onStartResize}
        sx={{
          width: 6,
          flexShrink: 0,
          cursor: "col-resize",
          bgcolor: "divider",
          transition: "background-color 0.15s",
          "&:hover": { bgcolor: "primary.main" },
        }}
      />
    </>
  );
};

export default ChatMessageDetailPanel;
