import sendResponse from "../utils/response.js";
import {
  AiSettingServiceError,
  createAiSetting,
  deleteAiSetting,
  getAiSetting,
  listAiSettings,
  updateAiSetting,
} from "../services/aiSettingService.js";

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof AiSettingServiceError) {
    return sendResponse(res, error.statusCode, error.message);
  }
  console.error(fallbackMessage, error);
  return sendResponse(res, 500, fallbackMessage, { error: error.message });
};

export const createAiSettingHandler = async (req, res) => {
  try {
    const { name, settingsJson } = req.body;
    const setting = await createAiSetting({
      userId: req.user.userId,
      name,
      settingsJson,
    });
    return sendResponse(res, 201, "AI setting created successfully", setting);
  } catch (error) {
    return handleError(res, error, "Failed to create AI setting");
  }
};

export const getAllAiSettingsHandler = async (req, res) => {
  try {
    const data = await listAiSettings({
      userId: req.user.userId,
      page: req.query.page,
      limit: req.query.limit,
    });
    return sendResponse(res, 200, "AI settings fetched successfully", data);
  } catch (error) {
    return handleError(res, error, "Failed to fetch AI settings");
  }
};

export const getAiSettingByIdHandler = async (req, res) => {
  try {
    const setting = await getAiSetting({
      userId: req.user.userId,
      aiSettingId: req.params.aiSettingId,
    });
    return sendResponse(res, 200, "AI setting fetched successfully", setting);
  } catch (error) {
    return handleError(res, error, "Failed to fetch AI setting");
  }
};

export const updateAiSettingHandler = async (req, res) => {
  try {
    const { name, settingsJson } = req.body;
    const setting = await updateAiSetting({
      userId: req.user.userId,
      aiSettingId: req.params.aiSettingId,
      name,
      settingsJson,
    });
    return sendResponse(res, 200, "AI setting updated successfully", setting);
  } catch (error) {
    return handleError(res, error, "Failed to update AI setting");
  }
};

export const deleteAiSettingHandler = async (req, res) => {
  try {
    const result = await deleteAiSetting({
      userId: req.user.userId,
      aiSettingId: req.params.aiSettingId,
    });
    return sendResponse(res, 200, "AI setting deleted successfully", result);
  } catch (error) {
    return handleError(res, error, "Failed to delete AI setting");
  }
};
