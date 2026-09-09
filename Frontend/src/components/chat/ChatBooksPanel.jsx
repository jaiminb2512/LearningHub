import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  AutoStories as ViewBookIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  MenuBook as BookIcon,
} from "@mui/icons-material";
import bookService from "../../services/bookService";
import noteService from "../../services/noteService";
import MarkdownPreview from "../markdown/MarkdownPreview";

const isSuccess = (response) =>
  Number(response?.success) === 200 || Number(response?.success) === 201;

const emptyBookForm = { title: "", description: "", summary: "" };

async function fetchAllNotesWithContent(bookId) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await noteService.getNotesByBook(bookId, {
      page,
      limit: 100,
      includeContent: true,
    });
    if (!isSuccess(response)) {
      throw new Error(response?.message || "Failed to load notes");
    }
    all.push(...(response.data?.notes || []));
    totalPages = response.data?.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

const ChatBooksPanel = ({ chatId, width, onClose, onStartResize }) => {
  const [view, setView] = useState("list"); // list | bookForm | notes | noteEditor | bookScroll
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [books, setBooks] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [editingBookId, setEditingBookId] = useState(null);

  const [activeBook, setActiveBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [readerNotes, setReaderNotes] = useState([]);
  const [noteSearchInput, setNoteSearchInput] = useState("");
  const [noteSearch, setNoteSearch] = useState("");

  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSection, setNoteSection] = useState("");
  const [noteSummary, setNoteSummary] = useState("");
  const [contentMode, setContentMode] = useState("edit");

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'book'|'note', item }

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await bookService.getAllBooks({
        page: 1,
        limit: 50,
        ...(search ? { q: search } : {}),
      });
      if (isSuccess(response)) {
        setBooks(response.data?.books || []);
      } else {
        setError(response?.message || "Failed to load books");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadNotes = useCallback(
    async (bookId) => {
      setLoading(true);
      setError("");
      try {
        const [bookRes, notesRes] = await Promise.all([
          bookService.getBookById(bookId),
          noteService.getNotesByBook(bookId, {
            page: 1,
            limit: 50,
            ...(noteSearch ? { q: noteSearch } : {}),
          }),
        ]);
        if (!isSuccess(bookRes)) {
          setError(bookRes?.message || "Book not found");
          setActiveBook(null);
          return;
        }
        setActiveBook(bookRes.data);
        if (isSuccess(notesRes)) {
          setNotes(notesRes.data?.notes || []);
        } else {
          setError(notesRes?.message || "Failed to load notes");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load notes");
      } finally {
        setLoading(false);
      }
    },
    [noteSearch]
  );

  useEffect(() => {
    if (view === "list") loadBooks();
  }, [view, loadBooks]);

  useEffect(() => {
    if (view === "notes" && activeBook?.bookId) {
      loadNotes(activeBook.bookId);
    }
  }, [view, activeBook?.bookId, loadNotes]);

  const openCreateBook = () => {
    setEditingBookId(null);
    setBookForm(emptyBookForm);
    setView("bookForm");
  };

  const openEditBook = (book) => {
    setEditingBookId(book.bookId);
    setBookForm({
      title: book.title || "",
      description: book.description || "",
      summary: book.summary || "",
    });
    setView("bookForm");
  };

  const openBookNotes = (book) => {
    setActiveBook(book);
    setNoteSearchInput("");
    setNoteSearch("");
    setView("notes");
  };

  const openBookScroll = async (book) => {
    setActiveBook(book);
    setReaderNotes([]);
    setView("bookScroll");
    setLoading(true);
    setError("");
    try {
      const [bookRes, allNotes] = await Promise.all([
        bookService.getBookById(book.bookId),
        fetchAllNotesWithContent(book.bookId),
      ]);
      if (isSuccess(bookRes)) {
        setActiveBook(bookRes.data);
      }
      setReaderNotes(allNotes);
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || "Failed to open book");
    } finally {
      setLoading(false);
    }
  };

  const openCreateNote = () => {
    setActiveNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteSection("");
    setNoteSummary("");
    setContentMode("edit");
    setView("noteEditor");
  };

  const openEditNote = async (note) => {
    if (!activeBook?.bookId) return;
    setLoading(true);
    setError("");
    try {
      const response = await noteService.getNoteById(activeBook.bookId, note.noteId);
      if (!isSuccess(response)) {
        setError(response?.message || "Note not found");
        return;
      }
      const data = response.data;
      setActiveNoteId(data.noteId);
      setNoteTitle(data.title || "");
      setNoteContent(data.content || "");
      setNoteSection(data.section || "");
      setNoteSummary(data.summary || "");
      setContentMode("edit");
      setView("noteEditor");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBook = async () => {
    if (!bookForm.title.trim()) {
      setError("Book title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: bookForm.title.trim(),
        description: bookForm.description.trim() || undefined,
        summary: bookForm.summary.trim() || undefined,
        ...(chatId && !editingBookId ? { threadId: chatId } : {}),
      };
      const response = editingBookId
        ? await bookService.updateBook(editingBookId, payload)
        : await bookService.createBook(payload);

      if (isSuccess(response)) {
        setView("list");
        await loadBooks();
      } else {
        setError(response?.message || "Failed to save book");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save book");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!activeBook?.bookId) return;
    if (!noteTitle.trim()) {
      setError("Note title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: noteTitle.trim(),
        content: noteContent,
        section: noteSection.trim() || undefined,
        summary: noteSummary.trim() || undefined,
        ...(chatId && !activeNoteId ? { threadId: chatId } : {}),
      };
      const response = activeNoteId
        ? await noteService.updateNote(activeBook.bookId, activeNoteId, payload)
        : await noteService.createNote(activeBook.bookId, payload);

      if (isSuccess(response)) {
        setView("notes");
        await loadNotes(activeBook.bookId);
      } else {
        setError(response?.message || "Failed to save note");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      let response;
      if (deleteTarget.type === "book") {
        response = await bookService.deleteBook(deleteTarget.item.bookId);
      } else {
        response = await noteService.deleteNote(
          activeBook.bookId,
          deleteTarget.item.noteId
        );
      }
      if (isSuccess(response)) {
        setDeleteTarget(null);
        if (deleteTarget.type === "book") {
          if (view !== "list") setView("list");
          await loadBooks();
        } else {
          if (view === "noteEditor") setView("notes");
          await loadNotes(activeBook.bookId);
        }
      } else {
        setError(response?.message || "Failed to delete");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const headerTitle =
    view === "list"
      ? "Books"
      : view === "bookForm"
        ? editingBookId
          ? "Edit book"
          : "New book"
        : view === "notes"
          ? activeBook?.title || "Notes"
          : view === "bookScroll"
            ? activeBook?.title || "Read book"
            : activeNoteId
              ? "Edit note"
              : "New note";

  const handleBack = () => {
    setError("");
    if (view === "bookForm") setView("list");
    else if (view === "notes") setView("list");
    else if (view === "bookScroll") setView("list");
    else if (view === "noteEditor") setView("notes");
  };

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
            {view !== "list" ? (
              <IconButton size="small" onClick={handleBack} disabled={saving}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            ) : (
              <BookIcon sx={{ fontSize: 20, color: "primary.main", mr: 0.5 }} />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {headerTitle}
              </Typography>
              {view === "notes" && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {activeBook?.noteCount ?? notes.length} note
                  {(activeBook?.noteCount ?? notes.length) === 1 ? "" : "s"}
                </Typography>
              )}
              {view === "bookScroll" && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  Scroll view · {readerNotes.length} note
                  {readerNotes.length === 1 ? "" : "s"}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {view === "list" && (
              <Tooltip title="New book">
                <IconButton size="small" color="primary" onClick={openCreateBook}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {view === "notes" && (
              <Tooltip title="New note">
                <IconButton size="small" color="primary" onClick={openCreateNote}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose} size="small" disabled={saving}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 2, minHeight: 0 }}>
          {error ? (
            <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
              {error}
            </Typography>
          ) : null}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : null}

          {!loading && view === "list" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search books…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearch(searchInput.trim());
                  }}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSearch(searchInput.trim())}
                >
                  Search
                </Button>
              </Box>

              {books.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No books yet. Create one to start taking notes.
                </Typography>
              ) : (
                <List disablePadding>
                  {books.map((book, index) => (
                    <React.Fragment key={book.bookId}>
                      {index > 0 ? <Divider component="li" /> : null}
                      <ListItem
                        disablePadding
                        secondaryAction={
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Tooltip title="View book">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => openBookScroll(book)}
                                aria-label="view book"
                              >
                                <ViewBookIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit book">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => openEditBook(book)}
                                aria-label="edit book"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete book">
                              <span>
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => setDeleteTarget({ type: "book", item: book })}
                                  aria-label="delete book"
                                  disabled={Boolean(book.isDefault)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemButton onClick={() => openBookNotes(book)} sx={{ pr: 14 }}>
                          <ListItemText
                            primary={book.title}
                            secondary={
                              book.description ||
                              `${book.noteCount ?? 0} note${book.noteCount === 1 ? "" : "s"}`
                            }
                            primaryTypographyProps={{ noWrap: true, fontWeight: 600 }}
                            secondaryTypographyProps={{ noWrap: true }}
                          />
                        </ListItemButton>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {!loading && view === "bookScroll" && (
            <Box
              sx={{
                mx: -2,
                mt: -2,
                mb: -2,
                px: 2,
                py: 2,
                bgcolor: "#f7f7f8",
                minHeight: "100%",
              }}
            >
              {activeBook?.description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {activeBook.description}
                </Typography>
              ) : null}

              {readerNotes.length === 0 ? (
                <Typography
                  sx={{ textAlign: "center", color: "text.secondary", fontStyle: "italic", py: 6 }}
                >
                  No notes in this book yet.
                </Typography>
              ) : (
                readerNotes.map((note, index) => (
                  <Box
                    key={note.noteId}
                    component="section"
                    sx={{
                      mb: 3,
                      pb: 3,
                      borderBottom:
                        index < readerNotes.length - 1 ? "1px solid #e5e5e5" : "none",
                    }}
                  >
                    {note.section ? (
                      <Typography
                        variant="overline"
                        sx={{ display: "block", mb: 0.5, letterSpacing: 1.1, color: "#6e6e80" }}
                      >
                        {note.section}
                      </Typography>
                    ) : null}
                    <Typography
                      component="h2"
                      sx={{
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        mb: 1.5,
                        pb: "0.3em",
                        borderBottom: "1px solid #d0d7de",
                        color: "#24292f",
                      }}
                    >
                      {note.title}
                    </Typography>
                    <MarkdownPreview>{note.content || ""}</MarkdownPreview>
                  </Box>
                ))
              )}
            </Box>
          )}

          {!loading && view === "bookForm" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Title"
                value={bookForm.title}
                onChange={(e) => setBookForm((p) => ({ ...p, title: e.target.value }))}
                fullWidth
                required
                size="small"
              />
              <TextField
                label="Description"
                value={bookForm.description}
                onChange={(e) => setBookForm((p) => ({ ...p, description: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
                size="small"
              />
              <TextField
                label="Summary"
                value={bookForm.summary}
                onChange={(e) => setBookForm((p) => ({ ...p, summary: e.target.value }))}
                fullWidth
                multiline
                minRows={3}
                size="small"
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button onClick={handleBack} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSaveBook} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </Box>
            </Box>
          )}

          {!loading && view === "notes" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {activeBook?.description ? (
                <Typography variant="body2" color="text.secondary">
                  {activeBook.description}
                </Typography>
              ) : null}
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search notes…"
                  value={noteSearchInput}
                  onChange={(e) => setNoteSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setNoteSearch(noteSearchInput.trim());
                  }}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setNoteSearch(noteSearchInput.trim())}
                >
                  Search
                </Button>
              </Box>
              <Divider />
              {notes.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No notes in this book yet.
                </Typography>
              ) : (
                <List disablePadding>
                  {notes.map((note) => (
                    <ListItem
                      key={note.noteId}
                      disablePadding
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => setDeleteTarget({ type: "note", item: note })}
                          aria-label="delete note"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemButton onClick={() => openEditNote(note)} sx={{ pr: 6 }}>
                        <ListItemText
                          primary={note.title}
                          secondary={note.section || note.summary || "Open to view / edit"}
                          primaryTypographyProps={{ noWrap: true, fontWeight: 600 }}
                          secondaryTypographyProps={{ noWrap: true }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {!loading && view === "noteEditor" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                fullWidth
                required
                size="small"
              />
              <TextField
                label="Section"
                value={noteSection}
                onChange={(e) => setNoteSection(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Summary"
                value={noteSummary}
                onChange={(e) => setNoteSummary(e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
              />
              <ToggleButtonGroup
                exclusive
                size="small"
                value={contentMode}
                onChange={(_, v) => v && setContentMode(v)}
              >
                <ToggleButton value="edit">Edit</ToggleButton>
                <ToggleButton value="preview">Preview</ToggleButton>
              </ToggleButtonGroup>
              {contentMode === "edit" ? (
                <TextField
                  label="Content (Markdown)"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  fullWidth
                  multiline
                  minRows={10}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      fontSize: 13,
                    },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1.5,
                    minHeight: 200,
                  }}
                >
                  <MarkdownPreview>{noteContent || "_Nothing to preview_"}</MarkdownPreview>
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                {activeNoteId ? (
                  <Button
                    color="error"
                    onClick={() =>
                      setDeleteTarget({
                        type: "note",
                        item: { noteId: activeNoteId, title: noteTitle },
                      })
                    }
                    disabled={saving}
                  >
                    Delete
                  </Button>
                ) : (
                  <span />
                )}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button onClick={handleBack} disabled={saving}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSaveNote} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !saving && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Delete {deleteTarget?.type === "book" ? "book" : "note"}?
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Delete “{deleteTarget?.item?.title}”? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatBooksPanel;
