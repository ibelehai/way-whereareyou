import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Stack,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useStories } from '../hooks/useStories';
import { alpha2ToName } from '../lib/countryCodes';

interface StoriesViewProps {
  countryCode?: string;
  countryName?: string;
  onBack: () => void;
  onAddStory: (code?: string, name?: string, mode?: 'stories' | 'people') => void;
  onStoryClick?: (id: string) => void;
  refreshKey: number;
  profileSlug?: string;
  mode?: 'stories' | 'people';
}

function countryFlagEmoji(code?: string) {
  if (!code) return '';
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  return String.fromCodePoint(...[...upper].map(c => 127397 + c.charCodeAt(0)));
}

export function StoriesView({ countryCode, countryName, onBack, onAddStory, onStoryClick, refreshKey, profileSlug = 'public', mode = 'stories' }: StoriesViewProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const perPage = 20;

  useEffect(() => {
    setPage(1);
  }, [countryCode, mode]);

  const { stories, loading, total } = useStories(countryCode, refreshKey, profileSlug, mode, page, perPage, sort);
  const resolvedName =
    (countryName && countryName.length > 3 ? countryName : alpha2ToName(countryName)) ||
    alpha2ToName(countryCode) ||
    countryCode;
  const heading = countryCode ? `${resolvedName} ${countryFlagEmoji(countryCode)}` : 'All Countries';

  const info = useMemo(() => {
    if (loading) return 'Loading stories...';
    if (!stories.length) return 'No stories yet.';
    return `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`;
  }, [loading, stories]);

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', py: 4, px: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
        <Stack spacing={0.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems="center">
            <Typography variant="h4" fontWeight={700}>{heading}</Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="sort-label">Sort</InputLabel>
              <Select
                labelId="sort-label"
                label="Sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
              >
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="oldest">Oldest</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {mode === 'people'
              ? `${info} from authors from this country`
              : info}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => onAddStory(countryCode, countryName, mode)}>
            {mode === 'people' ? 'Add a story' : 'Add a story'}
          </Button>
          <Button variant="outlined" onClick={onBack}>
            Back to map
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">Loading stories...</Typography>
      ) : stories.length === 0 ? (
        <Typography color="text.secondary">No stories yet for this country.</Typography>
      ) : (
        <Grid container spacing={2}>
          {stories.map((story) => (
            <Grid item xs={12} md={6} key={story.id}>
              <Card
                variant="outlined"
                sx={{ height: '100%', cursor: onStoryClick ? 'pointer' : 'default' }}
                onClick={() => onStoryClick?.(story.id)}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <div>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {story.author_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {mode === 'people'
                          ? `${story.author_country_name} ${countryFlagEmoji(story.author_country_code)}`
                          : `${story.country_name} ${countryFlagEmoji(story.country_code)}`}
                      </Typography>
                    </div>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(story.created_at).toLocaleDateString()}
                    </Typography>
                  </Stack>
                  <Typography variant="body1" color="text.primary" mb={2}>
                    {story.story}
                  </Typography>
                  {story.photo_url && (
                    <CardMedia
                      component="img"
                      image={story.photo_url}
                      alt="Story attachment"
                      sx={{ height: 200, borderRadius: 2, objectFit: 'cover' }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" mt={3}>
        <Pagination
          page={page}
          count={Math.max(1, Math.ceil(total / perPage))}
          onChange={(_, val) => setPage(val)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Stack>
    </Box>
  );
}
