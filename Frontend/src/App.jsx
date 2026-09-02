import React, { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Box, useTheme, useMediaQuery, CircularProgress, Backdrop } from '@mui/material'
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
import SystemPromptPage from './pages/SystemPromptPage.jsx';
const AIChatListPage = lazy(() => import('./pages/AIChatListPage.jsx'));
const AIChatDetailPage = lazy(() => import('./pages/AIChatDetailPage.jsx'));
import { lightTheme, darkTheme } from './styles/theme'
import SidebarNavigation, { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from './components/sidebar/SidebarNavigation.jsx'
import TopHeader from './components/sidebar/TopHeader.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import authService from './services/authService'
import { HeaderActionsContext } from './components/sidebar/HeaderActionsContext.js'
import './App.css'

function AppContent({ themeMode, toggleTheme }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(false);
  const [headerActions, setHeaderActions] = useState(null);

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  const currentSidebarWidth = !isMobile && desktopOpen ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_COLLAPSED;

  return (
    <HeaderActionsContext.Provider value={{ headerActions, setHeaderActions }}>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {!isAuthPage && (
          <>
            <TopHeader
              onMenuClick={handleDrawerToggle}
              sidebarWidth={currentSidebarWidth}
              desktopOpen={desktopOpen}
              onDesktopToggle={handleDesktopToggle}
            />

            <SidebarNavigation
              mode={themeMode}
              onThemeChange={toggleTheme}
              mobileOpen={mobileOpen}
              onMobileClose={() => setMobileOpen(false)}
              desktopOpen={desktopOpen}
              onDesktopToggle={handleDesktopToggle}
            />
          </>
        )}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            pt: !isAuthPage ? { xs: '56px', md: '64px' } : 0,
            width: { xs: '100%', md: !isAuthPage ? `calc(100% - ${currentSidebarWidth}px)` : '100%' },
            transition: (theme) => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            '&::-webkit-scrollbar': {
              width: '12px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px',
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }
          }}
        >
          <Suspense fallback={<Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}><CircularProgress color="inherit" /></Backdrop>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/ai-chat" replace />} />
                <Route path="/manage/system-prompts" element={<SystemPromptPage />} />
                <Route path="/ai-chat" element={<AIChatListPage />} />
                <Route path="/ai-chat/:chatId" element={<AIChatDetailPage />} />
              </Route>
            </Routes>
          </Suspense>
        </Box>
      </Box>
    </HeaderActionsContext.Provider>
  );
}

function App() {
  const [themeMode, setThemeMode] = useState('light');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authService.verifyToken().catch(() => {
        console.log("Token verification failed on app load");
      });
    }

    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newThemeMode);
    localStorage.setItem('themeMode', newThemeMode);
  };

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent themeMode={themeMode} toggleTheme={toggleTheme} />
      </Router>
    </ThemeProvider>
  )
}

export default App
