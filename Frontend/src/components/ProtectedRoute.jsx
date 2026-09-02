import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import authService from '../services/authService';

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true/false = result
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            // Verify token with backend
            const { valid } = await authService.verifyToken();
            setIsAuthenticated(valid);
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;