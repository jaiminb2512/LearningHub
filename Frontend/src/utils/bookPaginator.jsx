import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Flatten notes into measurable content blocks.
 */
export function notesToBlocks(notes) {
  const blocks = [];

  notes.forEach((note, noteIndex) => {
    if (note.section?.trim()) {
      blocks.push({
        id: `${note.noteId}-section`,
        type: 'section',
        text: note.section.trim(),
        noteId: note.noteId,
        noteIndex,
      });
    }

    blocks.push({
      id: `${note.noteId}-title`,
      type: 'title',
      text: note.title || 'Untitled',
      noteId: note.noteId,
      noteIndex,
      continued: false,
    });

    const content = (note.content || '').trim();
    if (!content) {
      blocks.push({
        id: `${note.noteId}-empty`,
        type: 'empty',
        noteId: note.noteId,
        noteIndex,
      });
      return;
    }

    // Prefer paragraph splits; keep fenced code blocks intact.
    const parts = splitMarkdownIntoChunks(content);
    parts.forEach((part, i) => {
      blocks.push({
        id: `${note.noteId}-md-${i}`,
        type: 'markdown',
        text: part,
        noteId: note.noteId,
        noteIndex,
      });
    });
  });

  return blocks;
}

function splitMarkdownIntoChunks(content) {
  const chunks = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let buffer = [];
  let inFence = false;

  const flush = () => {
    const text = buffer.join('\n').trim();
    if (text) chunks.push(text);
    buffer = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      buffer.push(line);
      if (!inFence) flush();
      continue;
    }

    if (inFence) {
      buffer.push(line);
      continue;
    }

    if (line.trim() === '') {
      flush();
    } else {
      buffer.push(line);
    }
  }
  flush();

  // Further split very large plain paragraphs by sentences for page fitting.
  const refined = [];
  for (const chunk of chunks) {
    if (chunk.startsWith('```') || chunk.length < 900) {
      refined.push(chunk);
      continue;
    }
    const sentences = chunk.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [chunk];
    let acc = '';
    for (const sentence of sentences) {
      const next = acc ? `${acc}${sentence}` : sentence;
      if (next.length > 700 && acc) {
        refined.push(acc.trim());
        acc = sentence;
      } else {
        acc = next;
      }
    }
    if (acc.trim()) refined.push(acc.trim());
  }
  return refined;
}

function BlockPreview({ block }) {
  if (block.type === 'section') {
    return (
      <div
        style={{
          fontSize: 12,
          letterSpacing: '1.1px',
          textTransform: 'uppercase',
          color: '#6e6e80',
          marginBottom: 4,
        }}
      >
        {block.text}
      </div>
    );
  }
  if (block.type === 'title') {
    return (
      <h2
        style={{
          fontSize: '1.35rem',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          margin: '0 0 12px',
          color: '#0d0d0d',
        }}
      >
        {block.text}
        {block.continued ? ' (continued)' : ''}
      </h2>
    );
  }
  if (block.type === 'empty') {
    return (
      <p style={{ fontStyle: 'italic', color: '#6e6e80', margin: 0 }}>This page is empty.</p>
    );
  }
  return (
    <div style={{ fontSize: '1rem', lineHeight: 1.75, color: '#0d0d0d', marginBottom: 12 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.text}</ReactMarkdown>
    </div>
  );
}

function BlocksPreview({ blocks }) {
  return (
    <div>
      {blocks.map((block) => (
        <div key={block.id}>
          <BlockPreview block={block} />
        </div>
      ))}
    </div>
  );
}

function splitTextBlock(block, pageWidth, maxHeight) {
  const text = block.text || '';
  if (!text || block.type !== 'markdown') return [block];

  const words = text.split(/(\s+)/);
  if (words.length <= 1) return [block];

  const pieces = [];
  let start = 0;

  while (start < words.length) {
    let low = start + 1;
    let high = words.length;
    let best = start + 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = {
        ...block,
        id: `${block.id}-p${pieces.length}`,
        text: words.slice(start, mid).join('').trim(),
      };
      if (!candidate.text) {
        low = mid + 1;
        continue;
      }
      const h = measureBlocksHeight([candidate], pageWidth);
      if (h <= maxHeight) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (best <= start) best = start + 1;
    const pieceText = words.slice(start, best).join('').trim();
    if (pieceText) {
      pieces.push({
        ...block,
        id: `${block.id}-p${pieces.length}`,
        text: pieceText,
      });
    }
    start = best;
  }

  return pieces.length ? pieces : [block];
}

function measureBlocksHeight(blocks, pageWidth) {
  const host = document.createElement('div');
  host.style.cssText = [
    'position:absolute',
    'left:-10000px',
    'top:0',
    `width:${Math.max(200, Math.floor(pageWidth))}px`,
    'visibility:hidden',
    'pointer-events:none',
    'box-sizing:border-box',
  ].join(';');
  document.body.appendChild(host);

  const root = createRoot(host);
  flushSync(() => {
    root.render(<BlocksPreview blocks={blocks} />);
  });
  const height = host.scrollHeight;
  flushSync(() => {
    root.unmount();
  });
  document.body.removeChild(host);
  return height;
}

/**
 * Pack note blocks into fixed-height book pages (no overflow scroll).
 * @returns {Array<{ blocks: any[] }>}
 */
export function paginateNotes(notes, { pageWidth, pageHeight }) {
  if (!notes?.length) return [];
  if (!pageWidth || !pageHeight || pageHeight < 80) {
    // Fallback: one note per page until we can measure.
    return notes.map((note) => ({
      blocks: notesToBlocks([note]),
    }));
  }

  const maxHeight = Math.max(120, pageHeight - 8);
  const rawBlocks = notesToBlocks(notes);
  const pages = [];
  let current = [];

  const fits = (list) => measureBlocksHeight(list, pageWidth) <= maxHeight;

  for (const block of rawBlocks) {
    const next = [...current, block];
    if (fits(next)) {
      current = next;
      continue;
    }

    if (current.length > 0) {
      pages.push({ blocks: current });
      current = [];
    }

    // Block alone may still overflow — split markdown text.
    if (block.type === 'markdown' && !fits([block])) {
      const pieces = splitTextBlock(block, pageWidth, maxHeight);
      for (const piece of pieces) {
        if (current.length && !fits([...current, piece])) {
          pages.push({ blocks: current });
          current = [];
        }
        if (!fits([piece]) && current.length === 0) {
          // Last resort: force onto its own page.
          pages.push({ blocks: [piece] });
        } else {
          current = [...current, piece];
        }
      }
      continue;
    }

    // Starting a continuation page mid-note: add continued title if needed.
    if (block.type !== 'title' && block.type !== 'section') {
      const continuedTitle = {
        id: `${block.noteId}-title-cont-${pages.length}`,
        type: 'title',
        text: notes.find((n) => n.noteId === block.noteId)?.title || 'Untitled',
        noteId: block.noteId,
        noteIndex: block.noteIndex,
        continued: true,
      };
      if (fits([continuedTitle, block])) {
        current = [continuedTitle, block];
      } else {
        current = [block];
      }
    } else {
      current = [block];
    }
  }

  if (current.length) {
    pages.push({ blocks: current });
  }

  return pages;
}
