import apiClient from "./apiClient";

export const getObservabilityOverview = async (days = 7) => {
  const response = await apiClient.get("/observability/overview", { params: { days } });
  return response.data.data;
};

export const getObservabilityTraces = async (params = {}) => {
  const response = await apiClient.get("/observability/traces", { params });
  return response.data.data;
};

export const getObservabilityTrace = async (traceId) => {
  const response = await apiClient.get(`/observability/traces/${traceId}`);
  return response.data.data;
};

export default {
  getObservabilityOverview,
  getObservabilityTraces,
  getObservabilityTrace,
};
