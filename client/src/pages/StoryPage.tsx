import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Card, CardContent, Stack } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Story } from '../types';
import { PRIMARY_COLOR, theme as baseTheme } from '../theme';
import { supabase } from '../lib/supabaseClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

export function StoryPage() {
  const { slug, id } = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileColor, setProfileColor] = useState(PRIMARY_COLOR);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    async function fetchStory() {
      if (!supabaseUrl || !slug || !id) {
        setError('Missing params');
        setLoading(false);
        return;
      }
      const profilePromise = supabase
        .from('profiles')
        .select('primary_color, name, slug')
        .eq('slug', slug)
        .maybeSingle();

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/get-story/${slug}/${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to load story');
        setStory(data.story);
      } catch (err: any) {
        setError(err?.message || 'Failed to load story');
      } finally {
        const { data: profile, error: profileError } = await profilePromise;
        if (!profileError && profile) {
          setProfileColor(profile.primary_color || PRIMARY_COLOR);
          setProfileName(profile.name || profile.slug || slug);
        } else {
          setProfileColor(PRIMARY_COLOR);
          setProfileName(slug);
        }
        setLoading(false);
      }
    }
    fetchStory();
  }, [slug, id]);

  useEffect(() => {
    if (story) {
      const name = story.country_name || 'Story';
      document.title = `${name} | WAY`;
    } else if (profileName) {
      document.title = `${profileName} | WAY`;
    }
  }, [story, profileName]);

  const dynamicTheme = useMemo(() => {
    return createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        primary: {
          ...baseTheme.palette.primary,
          main: profileColor
        }
      }
    });
  }, [profileColor]);

  if (loading) {
    return (
      <ThemeProvider theme={dynamicTheme}>
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !story) {
    return (
      <ThemeProvider theme={dynamicTheme}>
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="error">{error || 'Story not found'}</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={dynamicTheme}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight={800}>{story.country_name}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {story.author_name} • {new Date(story.created_at).toLocaleDateString()}
              </Typography>
              {story.story && (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {story.story}
                </Typography>
              )}
              {story.photo_url && (
                <Box component="img" src={story.photo_url} alt="Story" sx={{ mt: 2, width: '100%', borderRadius: 2 }} />
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}
