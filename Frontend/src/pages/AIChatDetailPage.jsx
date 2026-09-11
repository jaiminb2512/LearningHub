import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Box, Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const AIChatContainer = lazy(() => import('../components/chat/AIChatContainer'));

const AIChatDetailPage = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { setHeaderActions } = useHeaderActions();
    const [showChatHeader, setShowChatHeader] = useState(true);

    useEffect(() => {
        setHeaderActions(
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={showChatHeader ? 'Hide chat header' : 'Show chat header'}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setShowChatHeader((prev) => !prev)}
                        sx={showChatHeader ? undefined : { bgcolor: 'action.selected' }}
                    >
                        {showChatHeader ? (
                            <KeyboardArrowUpIcon fontSize="small" />
                        ) : (
                            <KeyboardArrowDownIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/ai-chat')}
                    size="small"
                    sx={{ height: 38, textTransform: 'none', fontWeight: 600 }}
                >
                    Back to Chats
                </Button>
            </Box>
        );

        return () => setHeaderActions(null);
    }, [navigate, setHeaderActions, showChatHeader]);

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflow: 'hidden'
        }}>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Suspense
                    fallback={
                        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CircularProgress size={36} />
                        </Box>
                    }
                >
                    <AIChatContainer chatId={chatId} showChatHeader={showChatHeader} />
                </Suspense>
            </Box>
        </Box>
    );
};

export default AIChatDetailPage;
