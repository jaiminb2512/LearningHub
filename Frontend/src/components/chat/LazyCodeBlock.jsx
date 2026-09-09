import React, { useEffect, useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

let highlighterPromise = null;
const loadHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = Promise.all([
      import("react-syntax-highlighter"),
      import("react-syntax-highlighter/dist/esm/styles/prism"),
    ]).then(([mod, styles]) => ({
      Prism: mod.Prism,
      style: styles.vscDarkPlus,
    }));
  }
  return highlighterPromise;
};

const CodeBlock = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const [highlighter, setHighlighter] = useState(null);
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");

  useEffect(() => {
    if (!match) return undefined;
    let cancelled = false;
    loadHighlighter().then((loaded) => {
      if (!cancelled) setHighlighter(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [match]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code
        {...props}
        style={{
          backgroundColor: "rgba(0,0,0,0.08)",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "0.85rem",
        }}
      >
        {children}
      </code>
    );
  }

  if (!match) {
    return (
      <pre>
        <code>{children}</code>
      </pre>
    );
  }

  const Highlighter = highlighter?.Prism;

  return (
    <Box sx={{ position: "relative", my: 1.5 }}>
      <Box sx={{ position: "absolute", top: 6, right: 6, zIndex: 2 }}>
        <Tooltip title={copied ? "Copied!" : "Copy Code"}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: "grey.300",
              bgcolor: "rgba(255,255,255,0.05)",
            }}
          >
            {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {Highlighter ? (
        <Highlighter
          style={highlighter.style}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "20px 16px",
            fontSize: "0.85rem",
            borderRadius: 8,
          }}
        >
          {code}
        </Highlighter>
      ) : (
        <Box
          component="pre"
          sx={{
            m: 0,
            p: "20px 16px",
            fontSize: "0.85rem",
            borderRadius: 2,
            bgcolor: "#1e1e1e",
            color: "#d4d4d4",
            overflow: "auto",
          }}
        >
          <code>{code}</code>
        </Box>
      )}
    </Box>
  );
};

export default CodeBlock;
