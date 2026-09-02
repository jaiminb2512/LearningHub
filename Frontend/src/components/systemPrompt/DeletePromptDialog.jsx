import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
} from '@mui/material';

const DeletePromptDialog = ({ open, promptName, loading, onClose, onConfirm }) => (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete system prompt?</DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary">
                <strong>{promptName}</strong> will be removed. Chats that used this prompt will keep their history,
                but the prompt link may be cleared.
            </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose} disabled={loading} color="inherit">
                Cancel
            </Button>
            <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Delete'}
            </Button>
        </DialogActions>
    </Dialog>
);

export default DeletePromptDialog;
