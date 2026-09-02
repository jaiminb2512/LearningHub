import React from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const MobileTopBar = ({ onMenuClick }) => {
    return (
        <AppBar
            position="fixed"
            sx={{
                display: { xs: 'flex', md: 'none' },
                zIndex: (theme) => theme.zIndex.drawer + 1,
                bgcolor: 'primary.dark'
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div">
                    Management
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default MobileTopBar;

