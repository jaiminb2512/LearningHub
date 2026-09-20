import sendResponse from "../utils/response.js";
import { getOverview, listTraces, getTrace } from "../services/observabilityService.js";

export const overview = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 30);
    return sendResponse(res, 200, "Observability overview fetched successfully", await getOverview(req.user.userId, days));
  } catch (error) {
    console.error("observability overview error:", error);
    return sendResponse(res, 500, "Failed to fetch observability overview", { error: error.message });
  }
};

export const traces = async (req, res) => {
  try {
    return sendResponse(res, 200, "Observability traces fetched successfully", await listTraces(req.user.userId, {
      limit: req.query.limit,
      status: req.query.status,
      threadId: req.query.threadId,
    }));
  } catch (error) {
    console.error("observability traces error:", error);
    return sendResponse(res, 500, "Failed to fetch observability traces", { error: error.message });
  }
};

export const trace = async (req, res) => {
  try {
    const result = await getTrace(req.user.userId, req.params.traceId);
    if (!result) return sendResponse(res, 404, "Trace not found");
    return sendResponse(res, 200, "Observability trace fetched successfully", result);
  } catch (error) {
    console.error("observability trace error:", error);
    return sendResponse(res, 500, "Failed to fetch observability trace", { error: error.message });
  }
};
