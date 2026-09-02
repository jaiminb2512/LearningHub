import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    Chip,
    Divider,
    IconButton,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PsychologyIcon from '@mui/icons-material/Psychology';

const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const PromptDetailPanel = ({ prompt, onEdit, onDelete, onCopy }) => {
    if (!prompt) {
        return (
            <Paper
                elevation={0}
                sx={{
                    height: '100%',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    p: 4,
                }}
            >
                <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
                    <PsychologyIcon sx={{ fontSize: 48, color: 'primary.light', mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                        Select a prompt
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Choose a system prompt from the list to preview it, or create a new one to define how your AI should behave.
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'background.paper',
            }}
        >
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h5" fontWeight={800} noWrap title={prompt.name}>
                            {prompt.name}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Chip size="small" label={`${prompt.prompt.length} chars`} />
                            <Chip size="small" variant="outlined" label={`Updated ${formatDateTime(prompt.updatedAt || prompt.createdAt)}`} />
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={0.5} flexShrink={0}>
                        <Tooltip title="Copy prompt text">
                            <IconButton onClick={() => onCopy(prompt.prompt)} aria-label="Copy prompt">
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => onEdit(prompt)}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => onDelete(prompt)}
                        >
                            Delete
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
                    Instructions
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography
                    component="pre"
                    sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'inherit',
                        fontSize: '0.95rem',
                        lineHeight: 1.7,
                        color: 'text.primary',
                        m: 0,
                    }}
                >
                    {prompt.prompt}
                </Typography>
            </Box>
        </Paper>
    );
};

export default PromptDetailPanel;
