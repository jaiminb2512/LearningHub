import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Stack,
    Chip
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, AutoAwesome } from '@mui/icons-material';
import authService from '../services/authService';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = async (data) => {
        setError('');
        setLoading(true);

        try {
            await authService.login({ emailId: data.email, password: data.password });
            navigate('/portfolio');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#F4F6F8',
                position: 'relative',
                p: 2
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3.5, sm: 4.5 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 3,
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    {/* Brand Icon Header */}
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 2.5,
                            bgcolor: '#1E293B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            mb: 2
                        }}
                    >
                        <LockOutlined sx={{ fontSize: 26 }} />
                    </Box>

                    <Chip
                        icon={<AutoAwesome sx={{ fontSize: '14px !important', color: '#2563EB !important' }} />}
                        label="LearningHib Portfolio Platform"
                        size="small"
                        sx={{
                            mb: 2,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            bgcolor: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #DBEAFE'
                        }}
                    />

                    <Typography component="h1" variant="h5" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', mb: 0.5 }}>
                        Welcome Back
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', mb: 3, textAlign: 'center' }}>
                        Sign in to access your portfolio & management suite
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2.5, borderRadius: '12px' }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
                        <Stack spacing={2.5}>
                            <Controller
                                name="email"
                                control={control}
                                rules={{
                                    required: 'Email address is required',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Please enter a valid email address'
                                    }
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        required
                                        fullWidth
                                        id="email"
                                        label="Email Address"
                                        name="email"
                                        autoComplete="email"
                                        autoFocus
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                '&:hover fieldset': { borderColor: '#2563EB' },
                                                '&.Mui-focused fieldset': { borderColor: '#2563EB' }
                                            }
                                        }}
                                    />
                                )}
                            />

                            <Controller
                                name="password"
                                control={control}
                                rules={{
                                    required: 'Password is required'
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        autoComplete="current-password"
                                        error={!!errors.password}
                                        helperText={errors.password?.message}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                '&:hover fieldset': { borderColor: '#2563EB' },
                                                '&.Mui-focused fieldset': { borderColor: '#2563EB' }
                                            }
                                        }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    py: 1.4,
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    bgcolor: '#2563EB',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                                    '&:hover': {
                                        bgcolor: '#1D4ED8',
                                        boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
                                    }
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                            </Button>

                            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                                <Link to="/register" style={{ textDecoration: 'none' }}>
                                    <Typography variant="body2" sx={{ color: '#2563EB', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                                        Don't have an account? Sign Up
                                    </Typography>
                                </Link>
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default LoginPage;
