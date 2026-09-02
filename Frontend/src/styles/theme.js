import { createTheme } from '@mui/material/styles';

const commonTypography = {
  fontFamily: '"Inter", "Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  button: {
    textTransform: 'none',
    fontWeight: 600,
  },
  h6: {
    fontWeight: 750,
    letterSpacing: '-0.01em',
  }
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4f46e5',
    },
    success: {
      main: '#107C41',
      light: '#e6f4ea',
      dark: '#0d6234',
    },
    background: {
      default: '#F4F6F8',
      paper: '#ffffff',
    },
    divider: '#E2E8F0',
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    action: {
      hover: '#F8FAFC',
      selected: '#EEF2F6',
    }
  },
  typography: commonTypography,
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        }
      }
    }
  }
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#818cf8',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    divider: '#1e293b',
  },
  typography: commonTypography,
  shape: {
    borderRadius: 8
  }
});
