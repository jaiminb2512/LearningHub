import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";

export const HITL_TYPES = {
  CONFIRMATION: "confirmation",
  SELECTIVE: "selective",
  SUGGESTIVE: "suggestive",
};

/**
 * Reusable HITL approval card for confirmation / selective / suggestive interrupts.
 * Every type includes an "anything else" free-text path.
 */
const HitlApprovalCard = ({ interrupt, loading = false, onSubmit, onCancel }) => {
  const type = interrupt?.type || HITL_TYPES.CONFIRMATION;
  const options = Array.isArray(interrupt?.options) ? interrupt.options : [];
  const fields = Array.isArray(interrupt?.fields) ? interrupt.fields : [];
  const allowMultiple = Boolean(interrupt?.allowMultiple);

  const [selected, setSelected] = useState(() =>
    Array.isArray(interrupt?.defaultSelected) ? interrupt.defaultSelected.map(String) : []
  );
  const [suggestion, setSuggestion] = useState(() => ({
    ...(interrupt?.suggestion && typeof interrupt.suggestion === "object"
      ? interrupt.suggestion
      : {}),
  }));
  const [userMessage, setUserMessage] = useState("");

  useEffect(() => {
    setSelected(
      Array.isArray(interrupt?.defaultSelected)
        ? interrupt.defaultSelected.map(String)
        : []
    );
    setSuggestion({
      ...(interrupt?.suggestion && typeof interrupt.suggestion === "object"
        ? interrupt.suggestion
        : {}),
    });
    setUserMessage("");
  }, [interrupt?.id, interrupt?.action]);

  const title = useMemo(() => {
    if (type === HITL_TYPES.SELECTIVE) return "Select an option";
    if (type === HITL_TYPES.SUGGESTIVE) return "Review & edit suggestion";
    return "Confirm action";
  }, [type]);

  const handleToggleOption = (id) => {
    const value = String(id);
    if (allowMultiple) {
      setSelected((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
      );
      return;
    }
    setSelected([value]);
  };

  const handleApprove = () => {
    if (type === HITL_TYPES.SELECTIVE && selected.length === 0) {
      return;
    }
    if (type === HITL_TYPES.SUGGESTIVE) {
      const missingRequired = fields.some(
        (field) => field.required && !String(suggestion?.[field.key] ?? "").trim()
      );
      if (missingRequired) return;
    }

    onSubmit?.({
      approved: true,
      selected,
      suggestion: type === HITL_TYPES.SUGGESTIVE ? suggestion : undefined,
    });
  };

  const handleReject = () => {
    onCancel?.({
      approved: false,
      reason: "Rejected by user",
      selected: [],
      suggestion: null,
    });
  };

  const handleSendOwnMessage = () => {
    const trimmed = userMessage.trim();
    if (!trimmed) return;
    onSubmit?.({
      approved: false,
      redirected: true,
      decision: "user_message",
      userMessage: trimmed,
      selected: [],
      suggestion: null,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.5,
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        maxWidth: 560,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        <Chip
          size="small"
          label={type}
          color={
            type === HITL_TYPES.SUGGESTIVE
              ? "secondary"
              : type === HITL_TYPES.SELECTIVE
                ? "info"
                : "warning"
          }
        />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {interrupt?.message || "Human approval required before continuing."}
      </Typography>

      {interrupt?.action && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          Action: {interrupt.action}
        </Typography>
      )}

      {type === HITL_TYPES.CONFIRMATION && interrupt?.data && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: "action.hover",
            fontFamily: "monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(interrupt.data, null, 2)}
        </Box>
      )}

      {type === HITL_TYPES.SELECTIVE && (
        <Box sx={{ mb: 2 }}>
          {allowMultiple ? (
            <FormGroup>
              {options.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  control={
                    <Checkbox
                      checked={selected.includes(String(opt.id))}
                      onChange={() => handleToggleOption(opt.id)}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {opt.label}
                      </Typography>
                      {opt.description ? (
                        <Typography variant="caption" color="text.secondary">
                          {opt.description}
                        </Typography>
                      ) : null}
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          ) : (
            <RadioGroup
              value={selected[0] || ""}
              onChange={(e) => setSelected([e.target.value])}
            >
              {options.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  value={String(opt.id)}
                  control={<Radio disabled={loading} />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {opt.label}
                      </Typography>
                      {opt.description ? (
                        <Typography variant="caption" color="text.secondary">
                          {opt.description}
                        </Typography>
                      ) : null}
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          )}
        </Box>
      )}

      {type === HITL_TYPES.SUGGESTIVE && (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {(fields.length
            ? fields
            : Object.keys(suggestion).map((key) => ({
                key,
                label: key,
                type: "text",
                required: false,
              }))
          ).map((field) => (
            <TextField
              key={field.key}
              label={field.label || field.key}
              value={suggestion?.[field.key] ?? ""}
              onChange={(e) =>
                setSuggestion((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
              fullWidth
              required={Boolean(field.required)}
              multiline={field.type === "textarea"}
              minRows={field.type === "textarea" ? 3 : undefined}
              disabled={loading}
            />
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleReject}
          disabled={loading}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={handleApprove}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {type === HITL_TYPES.SUGGESTIVE
            ? "Apply"
            : type === HITL_TYPES.SELECTIVE
              ? "Continue"
              : "Approve"}
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        Or tell me something else
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Skip this action and send your own message instead.
      </Typography>
      <TextField
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        placeholder="Type anything else you want the AI to do…"
        fullWidth
        multiline
        minRows={2}
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendOwnMessage();
          }
        }}
      />
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
        <Button
          variant="outlined"
          onClick={handleSendOwnMessage}
          disabled={loading || !userMessage.trim()}
        >
          Send message
        </Button>
      </Stack>
    </Paper>
  );
};

export default HitlApprovalCard;
