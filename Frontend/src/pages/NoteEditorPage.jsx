import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import noteService from '../services/noteService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const isSuccess = (response) => Number(response?.success) === 200 || Number(response?.success) === 201;

const NoteEditorPage = () => {
  const { bookId, noteId } = useParams();
  const navigate = useNavigate();
  const { setHeaderActions } = useHeaderActions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [section, setSection] = useState('');
  const [summary, setSummary] = useState('');
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

  useEffect(() => {
    setHeaderActions(
      <Button
        variant="contained"
        size="small"
        onClick={handleSave}
        disabled={saving || loading}
        sx={{ height: 38, px: 2, fontWeight: 600 }}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    );
    return () => setHeaderActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeaderActions, saving, loading, title, content, section, summary]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="false" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate(`/books/${bookId}`)} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Back to book
        </Typography>
      </Box>

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
        <TextField
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          multiline
          minRows={16}
          placeholder="Write in Markdown…"
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 14,
              lineHeight: 1.6,
            },
          }}
        />
      </Box>

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
