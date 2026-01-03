import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import './index.css';
import App from './App.tsx';
import { SignupPage } from './pages/SignupPage';
import { LandingPage } from './pages/LandingPage';
import { theme } from './theme';
import { StoryPage } from './pages/StoryPage';

function LegacyRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/places/${slug}/map`} replace />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/places/:slug" element={<App />} />
          <Route path="/places/:slug/:view" element={<App />} />
          <Route path="/places/:slug/story/:id" element={<StoryPage />} />
          <Route path="/:slug" element={<LegacyRedirect />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
