import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Snackbar,
    Alert,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { systemPromptService } from '../services/systemPromptService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';
import PromptSidebar from '../components/systemPrompt/PromptSidebar';
import PromptDetailPanel from '../components/systemPrompt/PromptDetailPanel';
import PromptFormDialog from '../components/systemPrompt/PromptFormDialog';
import DeletePromptDialog from '../components/systemPrompt/DeletePromptDialog';

const isSuccessResponse = (response) => Number(response?.success) === 200;

const SystemPromptPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { setHeaderActions } = useHeaderActions();
    const fetchIdRef = useRef(0);

    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const selectedPrompt = useMemo(
        () => prompts.find((prompt) => prompt.systemPromptId === selectedId) || null,
        [prompts, selectedId]
    );

    const showToast = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const loadPrompts = useCallback(async (page = 1) => {
        const fetchId = ++fetchIdRef.current;
        setLoading(true);

        try {
            const response = await systemPromptService.getAll({ page, pageSize: 12 });

            if (fetchId !== fetchIdRef.current) return;

            if (!isSuccessResponse(response)) {
                setPrompts([]);
                showToast(response?.message || 'Failed to load system prompts', 'error');
                return;
            }

            const list = response.data?.prompts ?? [];
            setPrompts(list);
            setTotalPages(Math.max(response.data?.totalPages ?? 0, 1));
            setTotal(response.data?.total ?? 0);

            setSelectedId((current) => {
                if (current && list.some((item) => item.systemPromptId === current)) {
                    return current;
                }
                return list[0]?.systemPromptId ?? null;
            });
        } catch (error) {
            if (fetchId !== fetchIdRef.current) return;
            console.error('Failed to fetch system prompts:', error);
            setPrompts([]);
            showToast('Failed to load system prompts', 'error');
        } finally {
            if (fetchId === fetchIdRef.current) {
                setLoading(false);
            }
        }
    }, [showToast]);

    useEffect(() => {
        loadPrompts(currentPage);
    }, [currentPage, loadPrompts]);

    useEffect(() => {
        setHeaderActions(
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => {
                    setEditingPrompt(null);
                    setFormOpen(true);
                }}
                sx={{ height: 38, px: 2, fontWeight: 600 }}
            >
                New prompt
            </Button>
        );

        return () => setHeaderActions(null);
    }, [setHeaderActions]);

    const handleSelect = (id) => {
        setSelectedId(id);
        if (isMobile) setShowMobileDetail(true);
    };

    const handleCreateOrUpdate = async (values) => {
        setFormLoading(true);
        try {
            const payload = {
                name: values.name.trim(),
                prompt: values.prompt.trim(),
            };

            if (editingPrompt) {
                const response = await systemPromptService.update(editingPrompt.systemPromptId, payload);
                if (isSuccessResponse(response)) {
                    showToast('System prompt updated');
                    setFormOpen(false);
                    setEditingPrompt(null);
                    await loadPrompts(currentPage);
                    setSelectedId(response.data.systemPromptId);
                } else {
                    showToast(response?.message || 'Failed to update system prompt', 'error');
                }
            } else {
                const response = await systemPromptService.create(payload);
                if (isSuccessResponse(response)) {
                    showToast('System prompt created');
                    setFormOpen(false);
                    if (currentPage !== 1) {
                        setCurrentPage(1);
                    } else {
                        await loadPrompts(1);
                    }
                    setSelectedId(response.data.systemPromptId);
                    if (isMobile) setShowMobileDetail(true);
                } else {
                    showToast(response?.message || 'Failed to create system prompt', 'error');
                }
            }
        } catch (error) {
            console.error('Failed to save system prompt:', error);
            showToast('Failed to save system prompt', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleteLoading(true);
        try {
            const response = await systemPromptService.delete(deleteTarget.systemPromptId, { softDelete: true });
            if (isSuccessResponse(response)) {
                showToast('System prompt deleted');
                const deletedId = deleteTarget.systemPromptId;
                setDeleteTarget(null);
                if (selectedId === deletedId) {
                    setSelectedId(null);
                    setShowMobileDetail(false);
                }
                await loadPrompts(currentPage);
            } else {
                showToast(response?.message || 'Failed to delete system prompt', 'error');
            }
        } catch (error) {
            console.error('Failed to delete system prompt:', error);
            showToast('Failed to delete system prompt', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Prompt copied to clipboard');
        } catch {
            showToast('Could not copy to clipboard', 'error');
        }
    };

    const handlePageChange = (_, page) => {
        setSearch('');
        setCurrentPage(page);
    };

    return (
        <Box sx={{ minHeight: 'calc(100vh - 112px)', p: { xs: 1.5, md: 2 }, bgcolor: 'background.default' }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '360px 1fr' },
                    gap: 2,
                    height: { xs: 'auto', md: 'calc(100vh - 128px)' },
                    minHeight: { xs: 'calc(100vh - 128px)', md: 'auto' },
                }}
            >
                {(!isMobile || !showMobileDetail) && (
                    <PromptSidebar
                        prompts={prompts}
                        loading={loading}
                        selectedId={selectedId}
                        search={search}
                        onSearchChange={setSearch}
                        onSelect={handleSelect}
                        pagination={{ page: currentPage, totalPages, total }}
                        onPageChange={handlePageChange}
                    />
                )}

                {(!isMobile || showMobileDetail) && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { xs: 480, md: 0 } }}>
                        {isMobile && (
                            <Button
                                startIcon={<ArrowBackIcon />}
                                onClick={() => setShowMobileDetail(false)}
                                sx={{ alignSelf: 'flex-start', mb: 1 }}
                            >
                                All prompts
                            </Button>
                        )}
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <PromptDetailPanel
                                prompt={selectedPrompt}
                                onEdit={(prompt) => {
                                    setEditingPrompt(prompt);
                                    setFormOpen(true);
                                }}
                                onDelete={setDeleteTarget}
                                onCopy={handleCopy}
                            />
                        </Box>
                    </Box>
                )}
            </Box>

            <PromptFormDialog
                open={formOpen}
                loading={formLoading}
                initialValues={editingPrompt}
                onClose={() => {
                    if (!formLoading) {
                        setFormOpen(false);
                        setEditingPrompt(null);
                    }
                }}
                onSubmit={handleCreateOrUpdate}
            />

            <DeletePromptDialog
                open={Boolean(deleteTarget)}
                promptName={deleteTarget?.name}
                loading={deleteLoading}
                onClose={() => !deleteLoading && setDeleteTarget(null)}
                onConfirm={handleDelete}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SystemPromptPage;
