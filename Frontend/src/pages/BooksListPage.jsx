import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Pagination,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import bookService from '../services/bookService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const isSuccess = (response) => Number(response?.success) === 200 || Number(response?.success) === 201;

const BooksListPage = () => {
  const navigate = useNavigate();
  const { setHeaderActions } = useHeaderActions();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bookService.getAllBooks({
        page,
        limit: 12,
        ...(search ? { q: search } : {}),
      });
      if (isSuccess(response)) {
        setBooks(response.data?.books || []);
        setTotalPages(response.data?.pagination?.totalPages || 1);
      } else {
        showToast(response?.message || 'Failed to load books', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load books', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    setHeaderActions(
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => {
          setForm({ title: '', description: '' });
          setDialogOpen(true);
        }}
        sx={{ height: 38, px: 2, fontWeight: 600 }}
      >
        New book
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await bookService.createBook({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
      });
      if (isSuccess(response)) {
        showToast('Book created');
        setDialogOpen(false);
        navigate(`/books/${response.data.bookId}`);
      } else {
        showToast(response?.message || 'Failed to create book', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to create book', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const response = await bookService.deleteBook(deleteTarget.bookId);
      if (isSuccess(response)) {
        showToast('Book deleted');
        setDeleteTarget(null);
        await loadBooks();
      } else {
        showToast(response?.message || 'Failed to delete book', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete book', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="false" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search books…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              setSearch(searchInput.trim());
            }
          }}
          sx={{ minWidth: 240, flex: 1 }}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : books.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No books yet. Create one to start taking notes.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {books.map((book) => (
            <Grid item xs={12} sm={6} md={4} key={book.bookId}>
              <Card variant="outlined" sx={{ height: '100%', position: 'relative' }}>
                <CardActionArea onClick={() => navigate(`/books/${book.bookId}`)} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ pr: book.isDefault ? 0 : 4, mb: 0.5 }}>
                      {book.title}
                      {book.isDefault ? (
                        <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          (default)
                        </Typography>
                      ) : null}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                      {book.description || 'No description'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {book.noteCount} note{book.noteCount === 1 ? '' : 's'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                {!book.isDefault && (
                  <IconButton
                    size="small"
                    aria-label="Delete book"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(book);
                    }}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
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

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New book</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            autoFocus
            label="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !submitting && setDeleteTarget(null)}>
        <DialogTitle>Delete book?</DialogTitle>
        <DialogContent>
          <Typography>
            Soft-delete “{deleteTarget?.title}” and all of its notes? This can be restored later in a future update.
          </Typography>
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

export default BooksListPage;
