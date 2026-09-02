import React, { useState } from 'react';
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    IconButton,
    Toolbar,
    Typography,
    Collapse,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Brightness4,
    Brightness7,
    Logout as LogoutIcon,
    ChevronLeft,
    ChevronRight,
    ExpandLess,
    ExpandMore
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { navItems, isPathActive } from '../../config/headerItems';
import authService from '../../services/authService';

const SIDEBAR_WIDTH = 280;
const SIDEBAR_WIDTH_COLLAPSED = 64;
const mainNavItems = navItems();

const SidebarNavigation = ({ mode, onThemeChange, mobileOpen, onMobileClose, desktopOpen, onDesktopToggle }) => {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [expandedSections, setExpandedSections] = useState({});

    const isDesktopOpen = !isMobile && desktopOpen;
    const sidebarWidth = isDesktopOpen ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_COLLAPSED;

    const handleLogout = async () => {
        await authService.logout();
    };

    const findPathToItem = (items, targetId, currentPath = []) => {
        for (const item of items) {
            const itemId = item.id || item.path || item.label;
            const newPath = [...currentPath, itemId];
            if (itemId === targetId) {
                return newPath;
            }
            if (item.children && item.children.length > 0) {
                const found = findPathToItem(item.children, targetId, newPath);
                if (found) return found;
            }
        }
        return null;
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => {
            const isCurrentlyOpen = !!prev[sectionId];
            if (isCurrentlyOpen) {
                // If closing, close this item and any of its children
                const next = { ...prev };
                delete next[sectionId];
                return next;
            }

            // If opening, keep ancestors open while ensuring only one sibling at each level is open
            const path = findPathToItem(mainNavItems, sectionId);
            if (!path) {
                return { ...prev, [sectionId]: true };
            }

            const next = {};
            // Keep all ancestor IDs leading to this section open
            path.forEach(id => {
                next[id] = true;
            });
            return next;
        });
    };

    const renderNavItem = (item, level = 0) => {
        const ItemIcon = item.icon;
        const activePaths = item.activePaths || (item.path ? [item.path] : []);
        const isActive = isPathActive(location.pathname, activePaths);
        const hasChildren = item.children && item.children.length > 0;
        const itemId = item.id || item.path || item.label;
        const isExpanded = expandedSections[itemId];
        // On mobile, always show full content. On desktop, respect isDesktopOpen
        const showFullContent = isMobile || isDesktopOpen;

        return (
            <React.Fragment key={itemId}>
                <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                        {...(!hasChildren && {
                            component: Link,
                            to: item.path,
                            onClick: () => {
                                if (isMobile) {
                                    onMobileClose();
                                }
                            }
                        })}
                        {...(hasChildren && {
                            onClick: (e) => {
                                e.preventDefault();
                                toggleSection(itemId);
                            }
                        })}
                        sx={{
                            minHeight: level > 0 ? 40 : 48,
                            justifyContent: showFullContent ? 'initial' : 'center',
                            px: 2.5,
                            bgcolor: isActive ? (level === 0 ? 'primary.light' : 'action.selected') : 'transparent',
                            color: isActive ? (level === 0 ? 'primary.contrastText' : 'inherit') : 'inherit',
                            '&:hover': {
                                bgcolor: isActive ? (level === 0 ? 'primary.main' : 'action.selected') : 'action.hover',
                            },
                            ...(level > 0 && {
                                pl: showFullContent ? (2.5 + level * 1.5) : 2.5,
                            })
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: showFullContent ? 3 : 'auto',
                                justifyContent: 'center',
                                color: isActive ? (level === 0 ? 'primary.contrastText' : 'primary.main') : 'inherit'
                            }}
                        >
                            <ItemIcon />
                        </ListItemIcon>
                        {showFullContent && (
                            <>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: level > 0 ? '0.875rem' : '0.9375rem',
                                        fontWeight: isActive ? (level === 0 ? 600 : 500) : 400
                                    }}
                                />
                                {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
                            </>
                        )}
                    </ListItemButton>
                </ListItem>

                {/* Render children if they exist and sidebar is open (always on mobile, conditional on desktop) */}
                {hasChildren && showFullContent && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.children.map((child) => renderNavItem(child, level + 1))}
                        </List>
                    </Collapse>
                )}
            </React.Fragment>
        );
    };

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Toolbar
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: (isMobile || isDesktopOpen) ? 'space-between' : 'center',
                    px: [2],
                    minHeight: '64px !important',
                    bgcolor: 'primary.dark',
                    color: 'white'
                }}
            >
                {(isMobile || isDesktopOpen) ? (
                    <>
                        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                            LearningHib
                        </Typography>
                        {isMobile ? (
                            <IconButton
                                onClick={onMobileClose}
                                sx={{ color: 'inherit' }}
                                size="small"
                            >
                                <ChevronLeft />
                            </IconButton>
                        ) : (
                            <IconButton
                                onClick={onDesktopToggle}
                                sx={{ color: 'inherit' }}
                                size="small"
                            >
                                <ChevronLeft />
                            </IconButton>
                        )}
                    </>
                ) : (
                    <IconButton
                        onClick={onDesktopToggle}
                        sx={{ color: 'inherit' }}
                        size="small"
                    >
                        <ChevronRight />
                    </IconButton>
                )}
            </Toolbar>

            <Divider />

            {/* Navigation Items */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
                <List>
                    {mainNavItems.map((item) => renderNavItem(item, 0))}
                </List>
            </Box>

            <Divider />

            {/* Footer Actions */}
            <Box sx={{ p: 1 }}>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={onThemeChange}
                            sx={{
                                minHeight: 48,
                                justifyContent: (isMobile || isDesktopOpen) ? 'initial' : 'center',
                                px: 2.5,
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: (isMobile || isDesktopOpen) ? 3 : 'auto',
                                    justifyContent: 'center',
                                }}
                            >
                                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                            </ListItemIcon>
                            {(isMobile || isDesktopOpen) && <ListItemText primary="Toggle Theme" />}
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{
                                minHeight: 48,
                                justifyContent: (isMobile || isDesktopOpen) ? 'initial' : 'center',
                                px: 2.5,
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: (isMobile || isDesktopOpen) ? 3 : 'auto',
                                    justifyContent: 'center',
                                }}
                            >
                                <LogoutIcon />
                            </ListItemIcon>
                            {(isMobile || isDesktopOpen) && <ListItemText primary="Logout" />}
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );

    return (
        <>
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: SIDEBAR_WIDTH,
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Permanent Drawer */}
            <Drawer
                variant="permanent"
                open
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: sidebarWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: sidebarWidth,
                        position: 'relative',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

// Export the sidebar width for use in App.jsx
export { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED };
export default SidebarNavigation;

