import { createTheme } from '@mui/material/styles';

const titleFont = '"Fraunces Variable", "Iowan Old Style", Georgia, serif';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#f2548f',
      dark: '#ad215c',
      light: '#ffe8f0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a879ff',
      dark: '#7b4bc4',
      light: '#efe5ff',
    },
    success: { main: '#1f9b74' },
    error: { main: '#e2395b' },
    background: {
      default: '#fff3f7',
      paper: '#ffffff',
    },
    text: {
      primary: '#3b1830',
      secondary: '#7d5470',
    },
    divider: '#f6d5e3',
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily:
      '"Nunito Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontFamily: titleFont, fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: titleFont, fontWeight: 650, letterSpacing: '-0.01em' },
    h6: { fontWeight: 800 },
    button: {
      fontWeight: 800,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 50,
          borderRadius: 999,
          paddingInline: 22,
          transition: 'transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease',
          '&:active': { transform: 'scale(0.95)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #ff7aa8 0%, #f2548f 50%, #d64ab9 100%)',
          boxShadow: '0 10px 28px rgba(242, 84, 143, 0.38)',
          '&:hover': { boxShadow: '0 14px 34px rgba(242, 84, 143, 0.45)' },
        },
        outlinedPrimary: {
          borderWidth: 1.5,
          background: 'rgba(255,255,255,0.7)',
          '&:hover': { borderWidth: 1.5 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform .25s cubic-bezier(.34,1.56,.64,1), background .2s ease',
          '&:active': { transform: 'scale(0.88)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: '1px solid #f6d5e3',
          boxShadow: '0 2px 6px rgba(173, 33, 92, 0.06), 0 12px 32px rgba(173, 33, 92, 0.09)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 24 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 999 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          background: '#fff',
          '& fieldset': { borderColor: '#f6d5e3', borderWidth: 1.5 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 18 } },
    },
  },
});
