import React, { useCallback, useEffect, useState } from 'react';
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
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Pagination,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import bookService from '../services/bookService';
import noteService from '../services/noteService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const isSuccess = (response) => Number(response?.success) === 200 || Number(response?.success) === 201;

const BookDetailPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { setHeaderActions } = useHeaderActions();

  const [book, setBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bookRes, notesRes] = await Promise.all([
        bookService.getBookById(bookId),
        noteService.getNotesByBook(bookId, {
          page,
          limit: 20,
          ...(search ? { q: search } : {}),
        }),
      ]);

      if (!isSuccess(bookRes)) {
        showToast(bookRes?.message || 'Book not found', 'error');
        setBook(null);
        return;
      }

      setBook(bookRes.data);

      if (isSuccess(notesRes)) {
        setNotes(notesRes.data?.notes || []);
        setTotalPages(notesRes.data?.pagination?.totalPages || 1);
      } else {
        showToast(notesRes?.message || 'Failed to load notes', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast(error?.response?.data?.message || 'Failed to load book', 'error');
    } finally {
      setLoading(false);
    }
  }, [bookId, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setHeaderActions(
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => {
          setNewTitle('');
          setCreateOpen(true);
        }}
        sx={{ height: 38, px: 2, fontWeight: 600 }}
      >
        New note
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await noteService.createNote(bookId, {
        title: newTitle.trim(),
        content: '',
      });
      if (isSuccess(response)) {
        setCreateOpen(false);
        navigate(`/books/${bookId}/notes/${response.data.noteId}`);
      } else {
        showToast(response?.message || 'Failed to create note', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to create note', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const response = await noteService.deleteNote(bookId, deleteTarget.noteId);
      if (isSuccess(response)) {
        showToast('Note deleted');
        setDeleteTarget(null);
        await load();
      } else {
        showToast(response?.message || 'Failed to delete note', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete note', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !book) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!book) {
    return (
      <Container maxWidth="false" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/books')}>
          Back to books
        </Button>
        <Typography sx={{ mt: 2 }}>Book not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="false" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/books')} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={600}>
            {book.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {book.description || 'No description'} · {book.noteCount} note
            {book.noteCount === 1 ? '' : 's'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search notes in this book…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              setSearch(searchInput.trim());
            }
          }}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <Button
          variant="outlined"
          onClick={() => {
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          Search
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : notes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No notes in this book yet.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Add first note
          </Button>
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          {notes.map((note, index) => (
            <React.Fragment key={note.noteId}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => setDeleteTarget(note)}>
                    <DeleteIcon />
                  </IconButton>
                }
                disablePadding
              >
                <ListItemButton onClick={() => navigate(`/books/${bookId}/notes/${note.noteId}`)}>
                  <ListItemText
                    primary={note.title}
                    secondary={
                      [note.section, note.summary].filter(Boolean).join(' · ') ||
                      `Order ${note.orderIndex}`
                    }
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      <Dialog open={createOpen} onClose={() => !submitting && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={submitting}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !submitting && setDeleteTarget(null)}>
        <DialogTitle>Delete note?</DialogTitle>
        <DialogContent>
          <Typography>Soft-delete “{deleteTarget?.title}”?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={submitting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={submitting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default BookDetailPage;
