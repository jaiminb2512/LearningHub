import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
    Typography,
    CircularProgress,
    Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const PromptFormDialog = ({ open, loading, onClose, onSubmit, initialValues = null }) => {
    const isEdit = Boolean(initialValues?.systemPromptId);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: {
            name: '',
            prompt: '',
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                name: initialValues?.name || '',
                prompt: initialValues?.prompt || '',
            });
        }
    }, [open, initialValues, reset]);

    const handleClose = () => {
        if (!loading) onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                    {isEdit ? 'Edit system prompt' : 'Create system prompt'}
                </Typography>
                <IconButton onClick={handleClose} disabled={loading} aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0 }}>
                    <Controller
                        name="name"
                        control={control}
                        rules={{
                            required: 'Name is required',
                            validate: (value) => value.trim().length > 0 || 'Name is required',
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Prompt name"
                                placeholder="e.g. Interview Coach, Code Reviewer"
                                fullWidth
                                autoFocus
                                error={Boolean(errors.name)}
                                helperText={errors.name?.message}
                            />
                        )}
                    />

                    <Controller
                        name="prompt"
                        control={control}
                        rules={{
                            required: 'Prompt text is required',
                            validate: (value) => value.trim().length > 0 || 'Prompt text is required',
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Prompt instructions"
                                placeholder="You are a helpful AI assistant that..."
                                fullWidth
                                multiline
                                minRows={10}
                                maxRows={18}
                                error={Boolean(errors.prompt)}
                                helperText={
                                    errors.prompt?.message ||
                                    `${field.value.length} characters — this guides how the AI behaves in chats`
                                }
                            />
                        )}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleClose} disabled={loading} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || (isEdit && !isDirty)}
                    >
                        {loading ? (
                            <CircularProgress size={22} color="inherit" />
                        ) : isEdit ? (
                            'Save changes'
                        ) : (
                            'Create prompt'
                        )}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default PromptFormDialog;
