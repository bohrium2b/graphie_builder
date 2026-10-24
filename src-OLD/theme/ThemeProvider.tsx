// ThemeProvider wrapper for Graphie Builder
// Handles color scheme detection and application

import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import './tokens.css';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}