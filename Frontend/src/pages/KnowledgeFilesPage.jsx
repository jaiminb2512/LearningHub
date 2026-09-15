import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as EmbedIcon,
  DeleteOutline as DeleteIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import knowledgeService from '../services/knowledgeService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const isSuccess = (response) => Number(response?.success) === 200 || Number(response?.success) === 201;

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusColor = (status) => {
  switch (status) {
    case 'READY':
      return 'success';
    case 'PROCESSING':
      return 'warning';
    case 'FAILED':
      return 'error';
    default:
      return 'default';
  }
};

const KnowledgeFilesPage = () => {
  const { setHeaderActions } = useHeaderActions();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [embeddingId, setEmbeddingId] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await knowledgeService.getLibrary();
      if (isSuccess(res)) {
        setFiles(res.data || []);
      } else {
        showToast(res?.message || 'Failed to load files', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setHeaderActions(
      <Button
        variant="contained"
        startIcon={<UploadFileIcon />}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        size="small"
        sx={{ height: 38, textTransform: 'none', fontWeight: 600 }}
      >
        Upload file
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions, uploading]);

  const handleFilePicked = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPendingFile(file);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || uploading) return;
    setUploading(true);
    try {
      const res = await knowledgeService.upload(pendingFile);
      if (isSuccess(res)) {
        showToast('File uploaded successfully');
        setPendingFile(null);
        await load();
      } else {
        showToast(res?.message || 'Upload failed', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateEmbeddings = async (knowledgeSourceId) => {
    setEmbeddingId(knowledgeSourceId);
    try {
      const res = await knowledgeService.generateEmbeddings(knowledgeSourceId);
      if (isSuccess(res)) {
        showToast(res?.data?.message || 'Embedding generation started');
        await load();
      } else {
        showToast(res?.message || 'Failed to generate embeddings', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to generate embeddings', 'error');
    } finally {
      setEmbeddingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await knowledgeService.deleteSource(deleteTarget.knowledgeSourceId);
      if (isSuccess(res)) {
        showToast('File deleted');
        setDeleteTarget(null);
        await load();
      } else {
        showToast(res?.message || 'Delete failed', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="false" sx={{ py: 3 }}>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".txt,.md,.markdown,.pdf,.doc,.docx"
        onChange={handleFilePicked}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : files.length === 0 ? (
        <Alert severity="info">No files uploaded yet. Use Upload file to add one.</Alert>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
          {files.map((file) => (
            <ListItem
              key={file.knowledgeSourceId}
              divider
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Generate embeddings">
                    <span>
                      <IconButton
                        color="primary"
                        size="small"
                        disabled={embeddingId === file.knowledgeSourceId}
                        onClick={() => handleGenerateEmbeddings(file.knowledgeSourceId)}
                      >
                        {embeddingId === file.knowledgeSourceId ? (
                          <CircularProgress size={18} />
                        ) : (
                          <EmbedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete file">
                    <IconButton size="small" onClick={() => setDeleteTarget(file)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 8 }}>
                    <Typography variant="body1" fontWeight={600} noWrap>
                      {file.originalName}
                    </Typography>
                    <Chip
                      label={file.status || 'UPLOADED'}
                      size="small"
                      color={statusColor(file.status)}
                    />
                  </Box>
                }
                secondary={`${formatBytes(file.sizeBytes)} · ${file.mimeType || 'unknown type'} · ${file.createdAt ? new Date(file.createdAt).toLocaleString() : ''
                  }`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={Boolean(pendingFile)} onClose={() => !uploading && setPendingFile(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Upload file?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1.5 }}>
            Upload this file to your knowledge library?
          </DialogContentText>
          {pendingFile ? (
            <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {pendingFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(pendingFile.size)}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingFile(null)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleConfirmUpload}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <UploadFileIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete file?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{deleteTarget?.originalName}</strong>? This removes the file and all thread attachments.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" disableElevation onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default KnowledgeFilesPage;
