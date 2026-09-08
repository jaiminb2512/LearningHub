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
import bookService from '../services/bookService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const isSuccess = (response) => Number(response?.success) === 200 || Number(response?.success) === 201;

const emptyForm = {
  title: '',
  description: '',
  summary: '',
};

const BookFormPage = () => {
  const { bookId } = useParams();
  const isEdit = Boolean(bookId);
  const navigate = useNavigate();
  const { setHeaderActions } = useHeaderActions();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isDefault, setIsDefault] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    if (!isEdit) {
      setForm(emptyForm);
      setIsDefault(false);
      setBookTitle('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await bookService.getBookById(bookId);
        if (!isSuccess(response)) {
          showToast(response?.message || 'Book not found', 'error');
          return;
        }
        if (cancelled) return;
        const book = response.data;
        setIsDefault(Boolean(book.isDefault));
        setBookTitle(book.title || '');
        setForm({
          title: book.title || '',
          description: book.description || '',
          summary: book.summary || '',
        });
      } catch (error) {
        showToast(error?.response?.data?.message || 'Failed to load book', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [bookId, isEdit]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        summary: form.summary.trim() || null,
      };

      if (isEdit) {
        const response = await bookService.updateBook(bookId, payload);
        if (isSuccess(response)) {
          showToast('Book updated');
          navigate('/books');
        } else {
          showToast(response?.message || 'Failed to update book', 'error');
        }
      } else {
        const response = await bookService.createBook(payload);
        if (isSuccess(response)) {
          showToast('Book created');
          navigate(`/books/${response.data.bookId}`);
        } else {
          showToast(response?.message || 'Failed to create book', 'error');
        }
      }
    } catch (error) {
      showToast(
        error?.response?.data?.message || (isEdit ? 'Failed to update book' : 'Failed to create book'),
        'error'
      );
    } finally {
      setSaving(false);
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
        <IconButton size="small" onClick={() => navigate('/books')} aria-label="Back to books">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.25 }}>
            {isEdit ? 'Edit book' : 'New book'}
          </Typography>
          <Typography noWrap variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
            {isEdit ? bookTitle || 'Update book details' : 'Fill in book details'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={saving || loading}
          sx={{ height: 38, px: 2, fontWeight: 600, flexShrink: 0 }}
        >
          {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
        </Button>
      </Box>
    );
    return () => setHeaderActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, loading, saving, form, bookTitle, navigate, setHeaderActions]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="false" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Title"
          value={form.title}
          onChange={handleChange('title')}
          fullWidth
          required
          disabled={isDefault}
          helperText={isDefault ? 'Inbox title cannot be changed' : undefined}
        />

        <TextField
          label="Description"
          value={form.description}
          onChange={handleChange('description')}
          fullWidth
          multiline
          minRows={2}
          placeholder="Short blurb for the book shelf"
        />

        <TextField
          label="Summary"
          value={form.summary}
          onChange={handleChange('summary')}
          fullWidth
          multiline
          minRows={3}
          placeholder="Longer overview / rolling summary"
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

export default BookFormPage;
