import React, { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * VS Code–like Markdown preview styles (light, GitHub-flavored).
 */
export const vscodeMarkdownSx = {
  color: '#24292f',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  fontSize: '16px',
  lineHeight: 1.6,
  wordWrap: 'break-word',

  '& > :first-of-type': { mt: 0 },
  '& > :last-child': { mb: 0 },

  '& p': {
    mt: 0,
    mb: '16px',
  },

  '& h1, & h2, & h3, & h4, & h5, & h6': {
    mt: '24px',
    mb: '16px',
    fontWeight: 600,
    lineHeight: 1.25,
    color: '#24292f',
  },
  '& h1': {
    fontSize: '2em',
    pb: '0.3em',
    borderBottom: '1px solid #d0d7de',
  },
  '& h2': {
    fontSize: '1.5em',
    pb: '0.3em',
    borderBottom: '1px solid #d0d7de',
  },
  '& h3': { fontSize: '1.25em' },
  '& h4': { fontSize: '1em' },
  '& h5': { fontSize: '0.875em' },
  '& h6': { fontSize: '0.85em', color: '#57606a' },

  '& a': {
    color: '#0969da',
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },

  '& strong': { fontWeight: 600 },
  '& em': { fontStyle: 'italic' },

  '& ul, & ol': {
    mt: 0,
    mb: '16px',
    pl: '2em',
  },
  '& ul': { listStyleType: 'disc' },
  '& ol': { listStyleType: 'decimal' },
  '& ul ul': { listStyleType: 'circle' },
  '& ul ul ul': { listStyleType: 'square' },
  '& li': { mb: '0.25em' },
  '& li > p': { mb: '8px' },
  '& li + li': { mt: '0.25em' },

  '& blockquote': {
    m: 0,
    mb: '16px',
    pl: '1em',
    color: '#57606a',
    borderLeft: '0.25em solid #d0d7de',
  },
  '& blockquote > :first-of-type': { mt: 0 },
  '& blockquote > :last-child': { mb: 0 },

  '& hr': {
    height: '0.25em',
    my: '24px',
    border: 0,
    backgroundColor: '#d0d7de',
  },

  '& img': {
    maxWidth: '100%',
    boxSizing: 'content-box',
    backgroundColor: '#fff',
  },

  '& table': {
    width: 'max-content',
    maxWidth: '100%',
    borderCollapse: 'collapse',
    display: 'block',
    overflow: 'auto',
    mb: '16px',
    borderSpacing: 0,
  },
  '& th, & td': {
    px: '13px',
    py: '6px',
    border: '1px solid #d0d7de',
  },
  '& th': {
    fontWeight: 600,
    backgroundColor: '#f6f8fa',
  },
  '& tr': {
    backgroundColor: '#fff',
    borderTop: '1px solid #d0d7de',
  },
  '& tr:nth-of-type(2n)': {
    backgroundColor: '#f6f8fa',
  },

  '& code': {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: '85%',
  },

  '& pre': {
    my: '16px',
    p: 0,
    overflow: 'auto',
    fontSize: '85%',
    lineHeight: 1.45,
    backgroundColor: '#f6f8fa',
    borderRadius: '6px',
  },

  '& input[type="checkbox"]': {
    mr: 1,
    verticalAlign: 'middle',
  },
};

const CodeBlock = ({ className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children).replace(/\n$/, '');
  const isInline = !match && !String(children).includes('\n');

  if (isInline) {
    return (
      <code
        {...props}
        className={className}
        style={{
          padding: '0.2em 0.4em',
          margin: 0,
          fontSize: '85%',
          backgroundColor: 'rgba(175,184,193,0.2)',
          borderRadius: 6,
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        }}
      >
        {children}
      </code>
    );
  }

  const language = match?.[1] || 'text';

  return (
    <Box sx={{ position: 'relative', my: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.75,
          bgcolor: '#eef1f4',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          borderBottom: '1px solid #d0d7de',
          fontSize: '12px',
          color: '#57606a',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        <span>{language}</span>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            sx={{ color: '#57606a', p: 0.5 }}
          >
            {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
      </Box>
      <SyntaxHighlighter
        style={oneLight}
        language={language === 'text' ? 'plaintext' : language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '13.6px',
          lineHeight: 1.45,
          background: '#f6f8fa',
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  );
};

/**
 * Renders Markdown with VS Code–style preview look.
 */
const MarkdownPreview = ({ children, sx = {}, components = {} }) => {
  if (!children?.trim()) {
    return (
      <Box sx={{ ...vscodeMarkdownSx, color: '#8c959f', fontStyle: 'italic', ...sx }}>
        Nothing to preview
      </Box>
    );
  }

  return (
    <Box sx={{ ...vscodeMarkdownSx, ...sx }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          ...components,
        }}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownPreview;
