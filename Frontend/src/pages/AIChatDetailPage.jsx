import React, { useEffect, Suspense, lazy } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const AIChatContainer = lazy(() => import('../components/chat/AIChatContainer'));

const AIChatDetailPage = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { setHeaderActions } = useHeaderActions();

    useEffect(() => {
        setHeaderActions(
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/ai-chat')}
                size="small"
                sx={{ height: 38, textTransform: 'none', fontWeight: 600 }}
            >
                Back to Chats
            </Button>
        );

        return () => setHeaderActions(null);
    }, [navigate, setHeaderActions]);

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
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress size={36} />
                        </Box>
                    }
                >
                    <AIChatContainer chatId={chatId} />
                </Suspense>
            </Box>
        </Box>
    );
};

export default AIChatDetailPage;
