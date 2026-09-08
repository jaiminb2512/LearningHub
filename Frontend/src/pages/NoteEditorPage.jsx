import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import noteService from '../services/noteService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';
import MarkdownPreview from '../components/markdown/MarkdownPreview';

const isSuccess = (response) => Number(response?.success) === 200 || Number(response?.success) === 201;

const NoteEditorPage = () => {
  const { bookId, noteId } = useParams();
  const navigate = useNavigate();
  const { setHeaderActions } = useHeaderActions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [section, setSection] = useState('');
  const [summary, setSummary] = useState('');
  const [contentMode, setContentMode] = useState('edit');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await noteService.getNoteById(bookId, noteId);
        if (isSuccess(response)) {
          setTitle(response.data.title || '');
          setContent(response.data.content || '');
          setSection(response.data.section || '');
          setSummary(response.data.summary || '');
        } else {
          showToast(response?.message || 'Note not found', 'error');
        }
      } catch (error) {
        showToast(error?.response?.data?.message || 'Failed to load note', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookId, noteId]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await noteService.updateNote(bookId, noteId, {
        title: title.trim(),
        content,
        section: section.trim() || null,
        summary: summary.trim() || null,
      });
      if (isSuccess(response)) {
        showToast('Saved');
      } else {
        showToast(response?.message || 'Failed to save', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await noteService.deleteNote(bookId, noteId);
      if (isSuccess(response)) {
        setDeleteOpen(false);
        navigate(`/books/${bookId}`);
      } else {
        showToast(response?.message || 'Failed to delete note', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete note', 'error');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    setHeaderActions(
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          minWidth: 0,
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(`/books/${bookId}`)}
          aria-label="Back to book"
          sx={{ flexShrink: 0 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.25 }}>
            {loading ? 'Loading…' : title.trim() || 'Untitled note'}
          </Typography>
          <Typography noWrap variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
            {contentMode === 'preview' ? 'Markdown preview' : 'Edit note'}
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={contentMode}
          onChange={(_, value) => {
            if (value) setContentMode(value);
          }}
          sx={{
            flexShrink: 0,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 1.5,
              py: 0.5,
            },
          }}
        >
          <ToggleButton value="edit">Edit</ToggleButton>
          <ToggleButton value="preview">Preview</ToggleButton>
        </ToggleButtonGroup>
        <IconButton
          size="small"
          color="error"
          aria-label="Delete note"
          title="Delete note"
          onClick={() => setDeleteOpen(true)}
          disabled={loading || deleting}
        >
          <DeleteIcon />
        </IconButton>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={saving || loading || deleting}
          sx={{ height: 38, px: 2, fontWeight: 600, flexShrink: 0 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>
    );
    return () => setHeaderActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeaderActions, saving, loading, deleting, title, content, section, summary, bookId, navigate, contentMode]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="false" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />
        <TextField
          label="Section (optional)"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          fullWidth
          placeholder="e.g. Chapter 3 — Hooks"
        />
        <TextField
          label="Summary (optional)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          fullWidth
        />

        {contentMode === 'edit' ? (
          <TextField
            label="Content (Markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            minRows={18}
            placeholder="Write in Markdown…"
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 14,
                lineHeight: 1.6,
              },
            }}
          />
        ) : (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: '#ffffff',
              minHeight: 420,
              px: { xs: 2, md: 3 },
              py: 2.5,
              overflow: 'auto',
            }}
          >
            <MarkdownPreview>{content}</MarkdownPreview>
          </Box>
        )}
      </Box>

      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 0.5,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete this note?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 1.5 }}>
            You’re about to delete:
          </Typography>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography fontWeight={600} noWrap>
              {title.trim() || 'Untitled note'}
            </Typography>
            {section?.trim() ? (
              <Typography variant="caption" color="text.secondary">
                {section.trim()}
              </Typography>
            ) : null}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This will soft-delete the note. You won’t see it in the book TOC anymore.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting…' : 'Delete note'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default NoteEditorPage;
