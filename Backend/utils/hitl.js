import { interrupt } from "@langchain/langgraph";

export const HITL_TYPES = {
  CONFIRMATION: "confirmation",
  SELECTIVE: "selective",
  SUGGESTIVE: "suggestive",
};

/**
 * Normalize a resume payload from the UI / API.
 */
export const normalizeHitlDecision = (raw = {}) => {
  const approved = raw.approved === true || raw.decision === "approved";
  return {
    approved,
    reason: typeof raw.reason === "string" ? raw.reason : undefined,
    selected: Array.isArray(raw.selected) ? raw.selected.map(String) : [],
    suggestion:
      raw.suggestion && typeof raw.suggestion === "object" && !Array.isArray(raw.suggestion)
        ? raw.suggestion
        : null,
  };
};

export const isHitlApproved = (decision) =>
  normalizeHitlDecision(decision).approved === true;

/**
 * Confirmation HITL — approve / reject a proposed action.
 */
export const requestConfirmation = ({
  action,
  message,
  data = {},
  toolName,
  entityType,
  entityId,
} = {}) => {
  return interrupt({
    type: HITL_TYPES.CONFIRMATION,
    action,
    toolName: toolName || action,
    message: message || `Allow ${action}?`,
    data,
    entityType: entityType || null,
    entityId: entityId || null,
  });
};

/**
 * Selective HITL — pick one or more options from a list.
 *
 * options: [{ id, label, description? }]
 */
export const requestSelective = ({
  action,
  message,
  options = [],
  allowMultiple = false,
  defaultSelected = [],
  data = {},
  toolName,
  entityType,
  entityId,
} = {}) => {
  const normalizedOptions = (Array.isArray(options) ? options : []).map((opt) => ({
    id: String(opt.id),
    label: opt.label || String(opt.id),
    description: opt.description || "",
  }));

  return interrupt({
    type: HITL_TYPES.SELECTIVE,
    action,
    toolName: toolName || action,
    message: message || `Select an option for ${action}`,
    options: normalizedOptions,
    allowMultiple: Boolean(allowMultiple),
    defaultSelected: (Array.isArray(defaultSelected) ? defaultSelected : []).map(String),
    data,
    entityType: entityType || null,
    entityId: entityId || null,
  });
};

/**
 * Suggestive HITL — review AI suggestion, edit fields, or provide your own values.
 *
 * fields: [{ key, label, type?: "text"|"textarea", required?: boolean }]
 * suggestion: object of proposed values
 */
export const requestSuggestive = ({
  action,
  message,
  suggestion = {},
  fields = [],
  data = {},
  toolName,
  entityType,
  entityId,
} = {}) => {
  const normalizedFields = (Array.isArray(fields) ? fields : []).map((field) => ({
    key: String(field.key),
    label: field.label || String(field.key),
    type: field.type === "textarea" ? "textarea" : "text",
    required: Boolean(field.required),
  }));

  return interrupt({
    type: HITL_TYPES.SUGGESTIVE,
    action,
    toolName: toolName || action,
    message: message || `Review or edit the suggestion for ${action}`,
    suggestion: suggestion && typeof suggestion === "object" ? suggestion : {},
    fields: normalizedFields,
    data,
    entityType: entityType || null,
    entityId: entityId || null,
  });
};

/**
 * Resolve selected option ids from a selective decision.
 * Falls back to defaultSelected when approved without an explicit selection.
 */
export const resolveSelectedIds = (decision, { defaultSelected = [], allowMultiple = false } = {}) => {
  const normalized = normalizeHitlDecision(decision);
  if (!normalized.approved) return [];

  const selected =
    normalized.selected.length > 0
      ? normalized.selected
      : (Array.isArray(defaultSelected) ? defaultSelected : []).map(String);

  if (!allowMultiple) {
    return selected.slice(0, 1);
  }
  return selected;
};

/**
 * Resolve final suggestion object (edited / custom / original).
 */
export const resolveSuggestion = (decision, originalSuggestion = {}) => {
  const normalized = normalizeHitlDecision(decision);
  if (!normalized.approved) return null;
  if (normalized.suggestion) {
    return { ...originalSuggestion, ...normalized.suggestion };
  }
  return { ...originalSuggestion };
};

export const rejectedToolResult = (action, reason = "Cancelled by user.") => ({
  success: false,
  cancelled: true,
  action,
  message: reason,
});
