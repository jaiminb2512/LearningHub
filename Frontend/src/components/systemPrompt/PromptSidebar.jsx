import React from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    Chip,
    CircularProgress,
    Pagination,
    Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PsychologyIcon from '@mui/icons-material/Psychology';

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const PromptSidebar = ({
    prompts,
    loading,
    selectedId,
    search,
    onSearchChange,
    onSelect,
    pagination,
    onPageChange,
}) => {
    const filteredPrompts = prompts.filter((prompt) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
            prompt.name.toLowerCase().includes(query) ||
            prompt.prompt.toLowerCase().includes(query)
        );
    });

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
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                    Your prompts
                </Typography>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search prompts..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : filteredPrompts.length > 0 ? (
                    <List disablePadding>
                        {filteredPrompts.map((prompt) => {
                            const selected = prompt.systemPromptId === selectedId;
                            return (
                                <ListItemButton
                                    key={prompt.systemPromptId}
                                    selected={selected}
                                    onClick={() => onSelect(prompt.systemPromptId)}
                                    sx={{
                                        alignItems: 'flex-start',
                                        py: 1.75,
                                        px: 2,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                <PsychologyIcon
                                                    sx={{
                                                        fontSize: 18,
                                                        color: selected ? 'primary.main' : 'text.secondary',
                                                    }}
                                                />
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight={700}
                                                    noWrap
                                                    sx={{ flex: 1 }}
                                                >
                                                    {prompt.name}
                                                </Typography>
                                            </Stack>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        mb: 1,
                                                    }}
                                                >
                                                    {prompt.prompt}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={formatDate(prompt.updatedAt || prompt.createdAt)}
                                                    sx={{ height: 22, fontSize: '0.7rem' }}
                                                />
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {search ? 'No prompts match your search.' : 'No system prompts yet.'}
                        </Typography>
                    </Box>
                )}
            </Box>

            {!search && pagination.totalPages > 1 && (
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={onPageChange}
                        color="primary"
                        size="small"
                        shape="rounded"
                    />
                </Box>
            )}
        </Paper>
    );
};

export default PromptSidebar;
