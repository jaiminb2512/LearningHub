import React, { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getPageTitle } from '../../config/headerItems';
import { useHeaderActions } from './HeaderActionsContext';

const TopHeader = ({ onMenuClick, sidebarWidth, desktopOpen, onDesktopToggle }) => {
    const location = useLocation();
    const { headerActions, setHeaderActions } = useHeaderActions();

    // Clear header actions on route change, before the new page's own
    // useEffect installs its title-bar button — useLayoutEffect runs before
    // passive effects, avoiding the race where the old button briefly shows.
    useLayoutEffect(() => {
        setHeaderActions(null);
    }, [location.pathname, setHeaderActions]);

    const pageTitle = getPageTitle(location.pathname);

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                width: { md: `calc(100% - ${sidebarWidth}px)` },
                ml: { md: `${sidebarWidth}px` },
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderBottom: '1px solid',
                borderColor: 'divider',
                transition: (theme) => theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            }}
        >
            <Toolbar
                sx={{
                    minHeight: { xs: 56, md: 64 },
                    px: { xs: 1, sm: 2 },
                    gap: { xs: 0.5, sm: 1 },
                }}
            >
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: { xs: 0.5, sm: 2 }, display: { md: 'none' }, flexShrink: 0 }}
                >
                    <MenuIcon />
                </IconButton>

                {pageTitle && (
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        title={pageTitle}
                        sx={{
                            fontWeight: 600,
                            flexGrow: 1,
                            minWidth: 0,
                            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {pageTitle}
                    </Typography>
                )}
                {/* When a page opts out of the static title (empty string), its
                    headerActions take over the full toolbar width. */}
                <Box
                    sx={{
                        flexGrow: pageTitle ? 0 : 1,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 0,
                    }}
                >
                    {headerActions}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default TopHeader;
