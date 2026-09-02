import React, { useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AIChatContainer from '../components/chat/AIChatContainer';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const AIChatDetailPage = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { setHeaderActions } = useHeaderActions();

    // Header Actions
    useEffect(() => {
        setHeaderActions(
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/ai/chat')}
                size="small"
                sx={{ height: 38, textTransform: 'none', fontWeight: 600 }}
            >
                Back to Chats
            </Button>
        );

        return () => setHeaderActions(null);
    }, []);

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflow: 'hidden'
        }}>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <AIChatContainer chatId={chatId} />
            </Box>
        </Box>
    );
};

export default AIChatDetailPage;
