import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AutoStories as PagesIcon,
  ViewDay as ScrollIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import bookService from '../services/bookService';
import noteService from '../services/noteService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';
import { paginateNotes } from '../utils/bookPaginator';
import MarkdownPreview from '../components/markdown/MarkdownPreview';

const isSuccess = (response) => Number(response?.success) === 200 || Number(response?.success) === 201;

const COLORS = {
  canvas: '#f7f7f8',
  page: '#ffffff',
  ink: '#0d0d0d',
  muted: '#6e6e80',
  border: '#e5e5e5',
  spine: '#ececf1',
  accent: '#10a37f',
  accentHover: '#0e8f6f',
  softShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)',
};

async function fetchAllNotes(bookId) {
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
      throw new Error(response?.message || 'Failed to load notes');
    }
    all.push(...(response.data?.notes || []));
    totalPages = response.data?.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

const PageBlocks = ({ blocks }) => (
  <Box>
    {blocks.map((block) => {
      if (block.type === 'section') {
        return (
          <Typography
            key={block.id}
            variant="overline"
            sx={{ display: 'block', mb: 0.5, letterSpacing: 1.1, color: COLORS.muted }}
          >
            {block.text}
          </Typography>
        );
      }
      if (block.type === 'title') {
        return (
          <Typography
            key={block.id}
            component="h2"
            sx={{
              fontSize: '1.5em',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              mb: 1.5,
              pb: '0.3em',
              borderBottom: '1px solid #d0d7de',
              color: '#24292f',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {block.text}
            {block.continued ? ' (continued)' : ''}
          </Typography>
        );
      }
      if (block.type === 'empty') {
        return (
          <Typography key={block.id} sx={{ fontStyle: 'italic', color: COLORS.muted }}>
            This page is empty.
          </Typography>
        );
      }
      return (
        <Box key={block.id} sx={{ mb: 1 }}>
          <MarkdownPreview>{block.text}</MarkdownPreview>
        </Box>
      );
    })}
  </Box>
);

const BookPage = ({ children, side, pageNumber, height }) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 0,
      height,
      bgcolor: COLORS.page,
      color: COLORS.ink,
      px: { xs: 2.5, md: 4 },
      pt: { xs: 2.5, md: 3.5 },
      pb: { xs: 1.5, md: 2 },
      position: 'relative',
      overflow: 'hidden',
      boxShadow:
        side === 'left'
          ? 'inset -12px 0 20px -16px rgba(0,0,0,0.08)'
          : side === 'right'
            ? 'inset 12px 0 20px -16px rgba(0,0,0,0.08)'
            : 'none',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
    {pageNumber != null && (
      <Typography
        variant="caption"
        sx={{
          mt: 1,
          flexShrink: 0,
          textAlign: 'center',
          color: COLORS.muted,
        }}
      >
        {pageNumber}
      </Typography>
    )}
  </Box>
);

const CoverPage = ({ book, pageCount }) => (
  <Box
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      px: 3,
      bgcolor: COLORS.page,
      color: COLORS.ink,
    }}
  >
    <Typography
      sx={{
        fontSize: { xs: '1.75rem', md: '2.25rem' },
        fontWeight: 600,
        letterSpacing: '-0.02em',
        mb: 1.5,
        px: 2,
      }}
    >
      {book?.title}
    </Typography>
    {book?.description && (
      <Typography
        sx={{
          fontSize: '1rem',
          color: COLORS.muted,
          maxWidth: 340,
          mb: 3,
          lineHeight: 1.6,
        }}
      >
        {book.description}
      </Typography>
    )}
    <Box sx={{ width: 40, height: 2, bgcolor: COLORS.accent, borderRadius: 1, mb: 3 }} />
    <Typography sx={{ fontSize: '0.875rem', color: COLORS.muted }}>
      {pageCount} page{pageCount === 1 ? '' : 's'}
    </Typography>
  </Box>
);

const ScrollView = ({ book, notes }) => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      bgcolor: COLORS.page,
      px: { xs: 2.5, md: 5 },
      py: { xs: 3, md: 4 },
      boxSizing: 'border-box',
      '&::-webkit-scrollbar': { width: 10 },
      '&::-webkit-scrollbar-track': { background: COLORS.canvas },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,0.22)',
        borderRadius: 5,
        border: `2px solid ${COLORS.canvas}`,
      },
      '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: 'rgba(0,0,0,0.35)',
      },
    }}
  >
    <Box sx={{ maxWidth: 760, mx: 'auto', pb: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 5, pt: 2 }}>
        <Typography
          sx={{
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            fontWeight: 600,
            letterSpacing: '-0.02em',
            mb: 1,
            color: '#24292f',
          }}
        >
          {book.title}
        </Typography>
        {book.description && (
          <Typography sx={{ color: COLORS.muted, mb: 2, lineHeight: 1.6 }}>
            {book.description}
          </Typography>
        )}
        <Box sx={{ width: 40, height: 2, bgcolor: COLORS.accent, borderRadius: 1, mx: 'auto', mb: 1 }} />
        <Typography sx={{ fontSize: '0.875rem', color: COLORS.muted }}>
          {notes.length} note{notes.length === 1 ? '' : 's'} · scroll to read
        </Typography>
      </Box>

      {notes.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: COLORS.muted, fontStyle: 'italic' }}>
          No notes in this book yet.
        </Typography>
      ) : (
        notes.map((note, index) => (
          <Box
            key={note.noteId}
            component="section"
            sx={{
              mb: 5,
              pb: 5,
              borderBottom: index < notes.length - 1 ? `1px solid ${COLORS.border}` : 'none',
            }}
          >
            {note.section && (
              <Typography
                variant="overline"
                sx={{ display: 'block', mb: 0.5, letterSpacing: 1.1, color: COLORS.muted }}
              >
                {note.section}
              </Typography>
            )}
            <Typography
              component="h2"
              sx={{
                fontSize: '1.5em',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                mb: 1.5,
                pb: '0.3em',
                borderBottom: '1px solid #d0d7de',
                color: '#24292f',
              }}
            >
              {note.title}
            </Typography>
            <MarkdownPreview>{note.content || ''}</MarkdownPreview>
          </Box>
        ))
      )}
    </Box>
  </Box>
);

const navBtnSx = {
  color: COLORS.ink,
  bgcolor: COLORS.page,
  border: `1px solid ${COLORS.border}`,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  '&:hover': {
    bgcolor: COLORS.canvas,
    borderColor: '#d9d9e3',
  },
  '&.Mui-disabled': {
    color: '#c5c5d2',
    bgcolor: COLORS.page,
    borderColor: COLORS.border,
  },
};

const BookReaderPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setHeaderActions } = useHeaderActions();

  const [book, setBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [viewMode, setViewMode] = useState('scroll');
  const [paginatedPages, setPaginatedPages] = useState([]);
  const [paginating, setPaginating] = useState(false);

  const measureHostRef = useRef(null);
  const [pageMetrics, setPageMetrics] = useState({ width: 0, height: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bookRes, notesList] = await Promise.all([
        bookService.getBookById(bookId),
        fetchAllNotes(bookId),
      ]);
      if (!isSuccess(bookRes)) {
        setError(bookRes?.message || 'Book not found');
        setBook(null);
        return;
      }
      setBook(bookRes.data);
      setNotes(notesList);
      setSpreadIndex(0);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Failed to open book');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  // Measure available content box for one book page leaf.
  useLayoutEffect(() => {
    const el = measureHostRef.current;
    if (!el) return undefined;

    const update = () => {
      const rect = el.getBoundingClientRect();
      // Content area inside padding + footer for page number (~28px)
      const padX = isMobile ? 40 : 64;
      const padY = isMobile ? 52 : 68;
      const width = Math.max(180, rect.width / (isMobile ? 1 : 2) - padX);
      const height = Math.max(160, rect.height - padY);
      setPageMetrics((prev) =>
        prev.width === Math.round(width) && prev.height === Math.round(height)
          ? prev
          : { width: Math.round(width), height: Math.round(height) }
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile, viewMode, loading]);

  useEffect(() => {
    if (viewMode !== 'pages' || !notes.length || !pageMetrics.width || !pageMetrics.height) {
      if (!notes.length) setPaginatedPages([]);
      return undefined;
    }

    let cancelled = false;
    setPaginating(true);

    // Defer so UI can paint; measurement uses sync DOM.
    const timer = window.setTimeout(() => {
      try {
        const pages = paginateNotes(notes, {
          pageWidth: pageMetrics.width,
          pageHeight: pageMetrics.height,
        });
        if (!cancelled) {
          setPaginatedPages(pages);
          setSpreadIndex((i) => Math.min(i, Math.max(0, Math.ceil(pages.length / (isMobile ? 1 : 2)))));
        }
      } catch (err) {
        console.error('paginateNotes failed', err);
        if (!cancelled) {
          setPaginatedPages(notes.map((note) => ({
            blocks: [
              ...(note.section
                ? [{ id: `${note.noteId}-section`, type: 'section', text: note.section }]
                : []),
              { id: `${note.noteId}-title`, type: 'title', text: note.title },
              {
                id: `${note.noteId}-md`,
                type: 'markdown',
                text: note.content || '',
              },
            ],
          })));
        }
      } finally {
        if (!cancelled) setPaginating(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [notes, pageMetrics, viewMode, isMobile]);

  const spreads = useMemo(() => {
    const items = [{ type: 'cover' }];
    const pages = paginatedPages;
    const step = isMobile ? 1 : 2;
    for (let i = 0; i < pages.length; i += step) {
      items.push({
        type: 'pages',
        left: pages[i] || null,
        right: isMobile ? null : pages[i + 1] || null,
        leftNumber: i + 1,
        rightNumber: isMobile ? null : pages[i + 1] ? i + 2 : null,
      });
    }
    return items;
  }, [paginatedPages, isMobile]);

  const maxSpread = Math.max(0, spreads.length - 1);
  const current = spreads[Math.min(spreadIndex, maxSpread)] || spreads[0];
  const totalBookPages = paginatedPages.length;

  const pageLabel =
    viewMode === 'scroll'
      ? `${notes.length} note${notes.length === 1 ? '' : 's'} · scroll to read`
      : current?.type === 'cover'
        ? `Cover · ${totalBookPages} page${totalBookPages === 1 ? '' : 's'}`
        : isMobile
          ? `Page ${current?.leftNumber || 0} of ${totalBookPages}`
          : `Pages ${current?.leftNumber || 0}${current?.rightNumber ? `–${current.rightNumber}` : ''} of ${totalBookPages}`;

  const goPrev = () => setSpreadIndex((i) => Math.max(0, i - 1));
  const goNext = () => setSpreadIndex((i) => Math.min(maxSpread, i + 1));

  useEffect(() => {
    if (viewMode !== 'pages') return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') navigate('/books');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSpread, navigate, viewMode]);

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
          onClick={() => navigate('/books')}
          aria-label="Back to books"
          sx={{ flexShrink: 0 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.25 }}>
            {book?.title || 'Book'}
          </Typography>
          <Typography noWrap variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
            {loading || paginating
              ? 'Preparing pages…'
              : viewMode === 'pages'
                ? `${pageLabel} · ← → to turn pages`
                : pageLabel}
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={viewMode}
          onChange={(_, value) => {
            if (value) setViewMode(value);
          }}
          sx={{
            flexShrink: 0,
            bgcolor: COLORS.page,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 1.25,
              py: 0.5,
              borderColor: COLORS.border,
              color: COLORS.muted,
              '&.Mui-selected': {
                bgcolor: COLORS.canvas,
                color: COLORS.ink,
                fontWeight: 600,
                '&:hover': { bgcolor: COLORS.canvas },
              },
            },
          }}
        >
          <ToggleButton value="pages" aria-label="Pages view">
            <PagesIcon sx={{ fontSize: 18, mr: 0.75 }} />
            Pages
          </ToggleButton>
          <ToggleButton value="scroll" aria-label="Scroll view">
            <ScrollIcon sx={{ fontSize: 18, mr: 0.75 }} />
            Scroll
          </ToggleButton>
        </ToggleButtonGroup>
        <Button
          size="small"
          onClick={() => navigate(`/books/${bookId}`)}
          sx={{
            color: '#fff',
            bgcolor: COLORS.accent,
            textTransform: 'none',
            fontWeight: 600,
            height: 38,
            px: 1.75,
            flexShrink: 0,
            '&:hover': { bgcolor: COLORS.accentHover },
          }}
        >
          TOC
        </Button>
      </Box>
    );
    return () => setHeaderActions(null);
  }, [book, bookId, loading, navigate, pageLabel, paginating, setHeaderActions, viewMode]);

  const bookHeight = { xs: '78vh', md: 'calc(100vh - 96px)' };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
          bgcolor: COLORS.canvas,
        }}
      >
        <CircularProgress sx={{ color: COLORS.accent }} />
      </Box>
    );
  }

  if (error || !book) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: COLORS.canvas, minHeight: '70vh' }}>
        <Typography color="error">{error || 'Book not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        height: 'calc(100vh - 64px)',
        px: { xs: 1, md: 2 },
        py: 1.5,
        bgcolor: COLORS.canvas,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {viewMode === 'scroll' ? (
        <Box
          sx={{
            width: '100%',
            maxWidth: 900,
            height: bookHeight,
            maxHeight: '100%',
            mx: 'auto',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: COLORS.softShadow,
            border: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.page,
            alignSelf: 'center',
            flex: 1,
          }}
        >
          <ScrollView book={book} notes={notes} />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: { xs: 0.5, md: 1.5 },
            minHeight: 0,
          }}
        >
          <IconButton onClick={goPrev} disabled={spreadIndex === 0} sx={{ ...navBtnSx, alignSelf: 'center' }}>
            <ChevronLeftIcon fontSize="large" />
          </IconButton>

          <Box
            ref={measureHostRef}
            sx={{
              width: '100%',
              maxWidth: current?.type === 'cover' && !isMobile ? 520 : 1280,
              height: bookHeight,
              maxHeight: '100%',
              display: 'flex',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: COLORS.softShadow,
              border: `1px solid ${COLORS.border}`,
              bgcolor: COLORS.page,
              transition: 'max-width 0.25s ease',
              alignSelf: 'center',
              position: 'relative',
            }}
          >
            {paginating && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(255,255,255,0.7)',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress size={28} sx={{ color: COLORS.accent }} />
              </Box>
            )}

            {current?.type === 'cover' ? (
              <Box sx={{ flex: 1 }}>
                <CoverPage book={book} pageCount={totalBookPages || notes.length} />
              </Box>
            ) : isMobile ? (
              <BookPage side="single" pageNumber={current.leftNumber} height="100%">
                {current.left ? <PageBlocks blocks={current.left.blocks} /> : null}
              </BookPage>
            ) : (
              <>
                <BookPage side="left" pageNumber={current.leftNumber} height="100%">
                  {current.left ? <PageBlocks blocks={current.left.blocks} /> : null}
                </BookPage>
                <Box
                  sx={{
                    width: 10,
                    flexShrink: 0,
                    bgcolor: COLORS.spine,
                    borderLeft: `1px solid ${COLORS.border}`,
                    borderRight: `1px solid ${COLORS.border}`,
                  }}
                />
                <BookPage side="right" pageNumber={current.rightNumber} height="100%">
                  {current.right ? <PageBlocks blocks={current.right.blocks} /> : (
                    <Box sx={{ height: '100%' }} />
                  )}
                </BookPage>
              </>
            )}
          </Box>

          <IconButton onClick={goNext} disabled={spreadIndex >= maxSpread} sx={{ ...navBtnSx, alignSelf: 'center' }}>
            <ChevronRightIcon fontSize="large" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default BookReaderPage;
