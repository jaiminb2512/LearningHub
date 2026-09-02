import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Divider,
    IconButton,
    Avatar,
    CircularProgress,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import {
    Add as AddIcon,
    Chat as ChatIcon,
    History as HistoryIcon,
    DeleteOutline as DeleteIcon,
    ArrowForwardIos as ArrowIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import threadService from '../services/threadService';
import { systemPromptService } from '../services/systemPromptService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const AIChatListPage = () => {
    const navigate = useNavigate();

    const [pastChats, setPastChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const [systemPrompts, setSystemPrompts] = useState([]);
    const [promptsLoading, setPromptsLoading] = useState(false);
    const { setHeaderActions } = useHeaderActions();

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promptMode, setPromptMode] = useState('select'); // 'select' | 'create'
    const [formData, setFormData] = useState({
        title: '',
        systemPromptId: '',
        promptName: '',
        promptText: '',
    });

    useEffect(() => {
        fetchThreads();
    }, [pagination.page]);

    const fetchSystemPrompts = async () => {
        setPromptsLoading(true);
        try {
            const response = await systemPromptService.getAll({ page: 1, pageSize: 100 });
            if (response.success === 200) {
                setSystemPrompts(response.data.prompts || []);
            }
        } catch (error) {
            console.error('Error fetching system prompts:', error);
        } finally {
            setPromptsLoading(false);
        }
    };

    const fetchThreads = async () => {
        setLoading(true);
        try {
            const response = await threadService.getAllThreads(pagination.page);
            if (response.success === 200) {
                setPastChats(response.data.threads);
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching threads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = () => {
        setFormData({
            title: '',
            systemPromptId: '',
            promptName: '',
            promptText: '',
        });
        setPromptMode('select');
        setOpenDialog(true);
        fetchSystemPrompts();
    };

    const handleCloseDialog = () => {
        if (!isSubmitting) {
            setOpenDialog(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const canSubmit = () => {
        if (!formData.title.trim()) return false;
        if (promptMode === 'select') return Boolean(formData.systemPromptId);
        return Boolean(formData.promptName.trim() && formData.promptText.trim());
    };

    const handleSubmitThread = async (e) => {
        e.preventDefault();
        if (!canSubmit()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                title: formData.title.trim(),
            };

            if (promptMode === 'select') {
                payload.systemPromptId = formData.systemPromptId;
            } else {
                payload.systemPrompt = {
                    name: formData.promptName.trim(),
                    prompt: formData.promptText.trim(),
                };
            }

            const response = await threadService.createThread(payload);

            if (response.success === 201) {
                setOpenDialog(false);
                navigate(`/ai-chat/${response.data.threadId}`);
            }
        } catch (error) {
            console.error('Error creating chat:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleContinueChat = (id) => {
        navigate(`/ai-chat/${id}`);
    };

    const handleDeleteChat = async (e, id) => {
        e.stopPropagation();
        try {
            const response = await threadService.deleteThread(id);
            if (response.success === 200) {
                fetchThreads();
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    const handlePageChange = (event, value) => {
        setPagination(prev => ({ ...prev, page: value }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Header Actions
    useEffect(() => {
        setHeaderActions(
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                size="small"
                sx={{ height: 38, px: 2, textTransform: 'none', fontWeight: 600 }}
            >
                New Chat
            </Button>
        );

        return () => setHeaderActions(null);
    }, []);

    return (
        <Box sx={{ minHeight: 'calc(100vh - 112px)', p: 2, bgcolor: '#F4F6F8' }}>
            <>
                <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', bgcolor: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                    <List disablePadding>
                        {loading ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : pastChats.length > 0 ? (
                            pastChats.map((chat, index) => (
                                <React.Fragment key={chat.threadId}>
                                    <ListItem
                                        secondaryAction={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="caption" color="text.disabled" sx={{ mr: 2 }}>
                                                    {formatDate(chat.createdAt)}
                                                </Typography>
                                                <IconButton edge="end" onClick={(e) => handleDeleteChat(e, chat.threadId)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        }
                                        disablePadding
                                    >
                                        <ListItemButton
                                            onClick={() => handleContinueChat(chat.threadId)}
                                            sx={{ py: 2, px: 3 }}
                                        >
                                            <ListItemIcon>
                                                <Avatar >
                                                    <ChatIcon fontSize="small" />
                                                </Avatar>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                        {chat.title}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '80%' }}>
                                                        {chat.systemPrompt?.name || 'No system prompt'} • {chat._count?.messages || 0} messages
                                                    </Typography>
                                                }
                                            />
                                            <ArrowIcon sx={{ fontSize: '0.8rem', color: 'text.disabled', ml: 2 }} />
                                        </ListItemButton>
                                    </ListItem>
                                    {index < pastChats.length - 1 && <Divider />}
                                </React.Fragment>
                            ))
                        ) : (
                            <Box sx={{ p: 8, textAlign: 'center' }}>
                                <Typography color="text.secondary">No past chats yet. Start your first session!</Typography>
                            </Box>
                        )}
                    </List>
                </Paper>

                {pagination.totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={pagination.totalPages}
                            page={pagination.page}
                            onChange={handlePageChange}
                            color="primary"
                            shape="rounded"
                        />
                    </Box>
                )}
            </>

            {/* Create New Chat Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>Start New Learning Session</Typography>
                    <IconButton onClick={handleCloseDialog} disabled={isSubmitting}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmitThread}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField
                            name="title"
                            label="Topic or Title"
                            placeholder="e.g. React Performance Optimization"
                            value={formData.title}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            autoFocus
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                System Prompt
                            </Typography>
                            <ToggleButtonGroup
                                value={promptMode}
                                exclusive
                                size="small"
                                fullWidth
                                onChange={(_, value) => {
                                    if (value) setPromptMode(value);
                                }}
                                sx={{ mb: 2 }}
                            >
                                <ToggleButton value="select" sx={{ textTransform: 'none' }}>
                                    Select existing
                                </ToggleButton>
                                <ToggleButton value="create" sx={{ textTransform: 'none' }}>
                                    Create new
                                </ToggleButton>
                            </ToggleButtonGroup>

                            {promptMode === 'select' ? (
                                promptsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : (
                                    <TextField
                                        select
                                        name="systemPromptId"
                                        label="Choose prompt"
                                        value={formData.systemPromptId}
                                        onChange={handleInputChange}
                                        fullWidth
                                        required
                                        SelectProps={{
                                            displayEmpty: true,
                                            renderValue: (selected) => {
                                                if (!selected) {
                                                    return (
                                                        <Typography component="span" color="text.secondary">
                                                            Select a prompt
                                                        </Typography>
                                                    );
                                                }
                                                const prompt = systemPrompts.find((p) => p.systemPromptId === selected);
                                                return prompt?.name || '';
                                            },
                                        }}
                                        helperText={
                                            systemPrompts.length === 0
                                                ? 'No prompts yet — switch to Create new'
                                                : 'This prompt guides the AI for this chat'
                                        }
                                    >
                                        {systemPrompts.map((p) => (
                                            <MenuItem key={p.systemPromptId} value={p.systemPromptId}>
                                                {p.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )
                            ) : (
                                <>
                                    <TextField
                                        name="promptName"
                                        label="Prompt Name"
                                        placeholder="e.g. Interview Coach"
                                        value={formData.promptName}
                                        onChange={handleInputChange}
                                        fullWidth
                                        required
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        name="promptText"
                                        label="Prompt Text"
                                        placeholder="You are an experienced AI teacher..."
                                        value={formData.promptText}
                                        onChange={handleInputChange}
                                        fullWidth
                                        required
                                        multiline
                                        minRows={4}
                                    />
                                </>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button
                            onClick={handleCloseDialog}
                            disabled={isSubmitting}
                            sx={{ color: 'text.secondary' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting || !canSubmit()}
                            sx={{ borderRadius: 2, px: 4 }}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Chat'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default AIChatListPage;
