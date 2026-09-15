import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  LinkOff as DetachIcon,
  UploadFile as UploadFileIcon,
} from "@mui/icons-material";
import knowledgeService from "../../services/knowledgeService";

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ChatKnowledgePanel = ({ chatId, width, onClose, onStartResize }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [library, setLibrary] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);

  const loadData = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    setError("");
    try {
      const [threadRes, libraryRes] = await Promise.all([
        knowledgeService.getThreadKnowledge(chatId),
        knowledgeService.getLibrary(),
      ]);
      setFiles(threadRes.data || []);
      setLibrary(libraryRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !chatId) return;
    setError("");
    setPendingFile(file);
  };

  const handleCancelUpload = () => {
    if (uploading) return;
    setPendingFile(null);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || !chatId || uploading) return;

    setUploading(true);
    setError("");
    try {
      await knowledgeService.upload(pendingFile, chatId);
      setPendingFile(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDetach = async (knowledgeSourceId) => {
    try {
      await knowledgeService.detachFromThread(chatId, knowledgeSourceId);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to detach file");
    }
  };

  const handleDelete = async (knowledgeSourceId) => {
    try {
      await knowledgeService.deleteSource(knowledgeSourceId);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete file");
    }
  };

  const handleAttachExisting = async (knowledgeSourceId) => {
    try {
      await knowledgeService.attachToThread(chatId, knowledgeSourceId);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to attach file");
    }
  };

  const attachedIds = new Set(files.map((f) => f.knowledgeSourceId));
  const unattachedLibrary = library.filter(
    (item) => !attachedIds.has(item.knowledgeSourceId)
  );

  return (
    <>
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
      <Box
        sx={{
          width,
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
              Knowledge files
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Upload or attach files to this chat
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 1.5, display: "flex", gap: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".txt,.md,.markdown,.pdf,.doc,.docx"
            onChange={handleFileChange}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <UploadFileIcon />}
            onClick={handleUploadClick}
            disabled={!chatId || uploading}
            disableElevation
            fullWidth
          >
            {uploading ? "Uploading..." : "Upload file"}
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              {error ? (
                <Typography variant="body2" color="error" sx={{ px: 1, mb: 1 }}>
                  {error}
                </Typography>
              ) : null}

              <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 700 }}>
                Attached to this chat
              </Typography>
              {files.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1.5 }}>
                  No files attached yet.
                </Typography>
              ) : (
                <List dense>
                  {files.map((file) => (
                    <ListItem
                      key={file.knowledgeSourceId}
                      secondaryAction={
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Detach from chat">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleDetach(file.knowledgeSourceId)}
                            >
                              <DetachIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete file">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleDelete(file.knowledgeSourceId)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={file.originalName}
                        secondary={`${formatBytes(file.sizeBytes)} · ${file.status}`}
                        primaryTypographyProps={{ noWrap: true, pr: 6 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 700 }}>
                Your library (attach older files)
              </Typography>
              {unattachedLibrary.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1.5 }}>
                  No other files in your library.
                </Typography>
              ) : (
                <List dense>
                  {unattachedLibrary.map((file) => (
                    <ListItem
                      key={file.knowledgeSourceId}
                      secondaryAction={
                        <Tooltip title="Attach to this chat">
                          <IconButton
                            edge="end"
                            size="small"
                            color="primary"
                            onClick={() => handleAttachExisting(file.knowledgeSourceId)}
                          >
                            <AttachFileIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={file.originalName}
                        secondary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatBytes(file.sizeBytes)}
                            </Typography>
                            <Chip label={file.status} size="small" sx={{ height: 18, fontSize: 10 }} />
                          </Box>
                        }
                        primaryTypographyProps={{ noWrap: true, pr: 5 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </Box>
      </Box>

      <Dialog
        open={Boolean(pendingFile)}
        onClose={handleCancelUpload}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Upload file?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1.5 }}>
            Do you want to upload this file and attach it to the current chat?
          </DialogContentText>
          {pendingFile ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: "action.hover",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" fontWeight={600} noWrap>
                {pendingFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(pendingFile.size)}
                {pendingFile.type ? ` · ${pendingFile.type}` : ""}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelUpload} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpload}
            variant="contained"
            disableElevation
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <UploadFileIcon />}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatKnowledgePanel;
