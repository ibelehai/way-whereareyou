import { createTheme } from '@mui/material/styles';

export const PRIMARY_COLOR = '#45803b';

export function lightenColor(hex: string, factor = 0.3): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * factor));
  g = Math.min(255, Math.round(g + (255 - g) * factor));
  b = Math.min(255, Math.round(b + (255 - b) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: PRIMARY_COLOR
    },
    secondary: {
      main: '#111827'
    },
    background: {
      default: '#f6f6f1',
      paper: '#f6f6f1'
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: '"Lexend", "Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 }
  }
});
