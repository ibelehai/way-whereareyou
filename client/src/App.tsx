import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Fab, Box, CircularProgress, Tabs, Tab, Typography, Stack, Button, Popover, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { WorldMap } from './components/WorldMap';
import { TimeFilter } from './components/TimeFilter';
import { AddStoryModal } from './components/AddStoryModal';
import { StoriesView } from './components/StoriesView';
import { useCountryHeat } from './hooks/useCountryHeat';
import { alpha2ToName } from './lib/countryCodes';
import logo from './assets/logo.png';
import type { TimeFilter as TimeFilterType } from './types';
import { supabase } from './lib/supabaseClient';
import { PRIMARY_COLOR, theme as baseTheme } from './theme';

function App() {
  const navigate = useNavigate();
  const { slug: slugParam, view: viewParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const profileSlug = (slugParam || 'public').toLowerCase();
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [view, setView] = useState<'map' | 'stories'>(viewParam === 'list' ? 'stories' : 'map');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCountryCode, setModalCountryCode] = useState<string>('');
  const [modalCountryName, setModalCountryName] = useState<string>('');
  const [modalAuthorCountryCode, setModalAuthorCountryCode] = useState<string>('');
  const [modalAuthorCountryName, setModalAuthorCountryName] = useState<string>('');
  const [storiesCountryCode, setStoriesCountryCode] = useState<string>('');
  const [storiesCountryName, setStoriesCountryName] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [heatMode, setHeatMode] = useState<'stories' | 'people'>('stories');
  const [initializedFromSearch, setInitializedFromSearch] = useState(false);
  const [profileName, setProfileName] = useState<string>('');
  const [profileColor, setProfileColor] = useState<string>(PRIMARY_COLOR);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [accessCodeParam, setAccessCodeParam] = useState<string>('');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [profileCountry, setProfileCountry] = useState<string>('');

  const { heatData, loading: heatLoading } = useCountryHeat(timeFilter, refreshKey, profileSlug, heatMode);

  const handleSeeStories = (countryCode: string, countryName: string) => {
    setStoriesCountryCode(countryCode);
    setStoriesCountryName(countryName);
    setView('stories');
    const params = new URLSearchParams(searchParams);
    params.set('mode', heatMode);
    params.set('country', countryCode);
    navigate(`/places/${profileSlug}/list?${params.toString()}`);
  };

  const handleAddStory = (countryCode?: string, countryName?: string, mode?: 'stories' | 'people') => {
    const effectiveMode = mode || heatMode;
    if (effectiveMode === 'people') {
      setModalAuthorCountryCode(countryCode || '');
      setModalAuthorCountryName(countryName || '');
      setModalCountryCode(profileCountry || '');
      setModalCountryName(alpha2ToName(profileCountry) || '');
    } else {
      setModalAuthorCountryCode('');
      setModalAuthorCountryName('');
      setModalCountryCode(countryCode || profileCountry || '');
      setModalCountryName(countryName || alpha2ToName(countryCode) || alpha2ToName(profileCountry) || '');
    }
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalCountryCode('');
    setModalCountryName('');
    setModalAuthorCountryCode('');
    setModalAuthorCountryName('');
  };

  const handleStorySuccess = () => {
    setRefreshKey((key) => key + 1);
    handleModalClose();
    setToast({ open: true, message: 'Story submitted!', severity: 'success' });
  };

  const goToSignup = () => {
    navigate('/signup');
  };

  useEffect(() => {
    if (initializedFromSearch) return;
    const modeParam = searchParams.get('mode');
    const countryParam = searchParams.get('country');

    if (modeParam === 'people' || modeParam === 'stories') {
      setHeatMode(modeParam);
    }
    if (countryParam) {
      const resolved = alpha2ToName(countryParam) || countryParam;
      setStoriesCountryCode(countryParam);
      setStoriesCountryName(resolved);
    }
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setAccessCodeParam(codeParam.toUpperCase());
    }
    setInitializedFromSearch(true);
  }, [searchParams, initializedFromSearch]);

  useEffect(() => {
    setView(viewParam === 'list' ? 'stories' : 'map');
  }, [viewParam]);

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, slug, primary_color, country')
        .eq('slug', profileSlug)
        .maybeSingle();
      if (!error && data) {
        setProfileName(data.name || data.slug || profileSlug);
        setProfileColor(data.primary_color || PRIMARY_COLOR);
        setProfileCountry((data.country || '').toUpperCase());
      } else {
        setProfileName(profileSlug);
        setProfileColor(PRIMARY_COLOR);
        setProfileCountry('');
      }
    }
    fetchProfile();
  }, [profileSlug]);

  useEffect(() => {
    const titleBase = profileName || profileSlug || 'WAY';
    document.title = `${titleBase} | WAY`;
  }, [profileName, profileSlug]);

  useEffect(() => {
    const params: Record<string, string> = { mode: heatMode };
    if (storiesCountryCode) params.country = storiesCountryCode;
    if (accessCodeParam) params.code = accessCodeParam;
    setSearchParams(params);
  }, [heatMode, storiesCountryCode, accessCodeParam, setSearchParams]);

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

  return (
    <ThemeProvider theme={dynamicTheme}>
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Box
        component="header"
        sx={{
          px: { xs: 2, md: 4 },
          py: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'center' },
          gap: 1,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="img"
            src={logo}
            alt="WAY logo"
            sx={{ width: 80, height: 80, objectFit: 'contain' }}
          />
          <Stack spacing={0.2}>
            <Typography variant="h4" fontWeight={800} color="#45803b">Way</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }} color="#45803b">
              Divided by borders
            </Typography>
            <Typography variant="caption" style={{ marginTop: -6}} sx={{ opacity: 0.7 }} color="#45803b">
              united by stories
            </Typography>
          </Stack>
        </Box>
        <Typography
          variant="h4"
          fontWeight={700}
          color="primary"
          sx={{
            display: { xs: 'block', md: 'none' },
            textAlign: 'center',
            width: '100%'
          }}
        >
          {profileName || profileSlug}
        </Typography>
        <Typography
          variant="h4"
          fontWeight={700}
          color="primary"
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            width: '100%',
            pointerEvents: 'none'
          }}
        >
          {profileName || profileSlug}
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, pb: 2, position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ flexGrow: 1 }} />
          <Tabs
            value={heatMode}
            onChange={(_, v) => setHeatMode(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          >
            <Tab value="people" label="People" />
            <Tab value="stories" label="Stories" />
          </Tabs>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            >
              Filters
            </Button>
          </Box>
        </Box>
      </Box>

      <Box component="main" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        {view === 'map' ? (
          heatLoading ? (
            <CircularProgress />
          ) : (
            <Box sx={{ width: '100%', position: 'relative' }}>
              <WorldMap
                heatData={heatData}
                mode={heatMode}
                primaryColor={profileColor}
                onSeeStories={handleSeeStories}
                onAddStory={(code, name) => handleAddStory(code, name, heatMode)}
                onSelectCountry={(code, name) => {
                  if (heatMode === 'stories') {
                    setStoriesCountryCode(code);
                    setStoriesCountryName(name);
                  }
                  // Prepare modal defaults based on mode
                  if (heatMode === 'stories') {
                    setModalCountryCode(code);
                    setModalCountryName(name);
                    setModalAuthorCountryCode('');
                    setModalAuthorCountryName('');
                  } else {
                    setModalAuthorCountryCode(code);
                    setModalAuthorCountryName(name);
                    setModalCountryCode(profileCountry || '');
                    setModalCountryName(alpha2ToName(profileCountry) || '');
                  }
                }}
              />
            </Box>
          )
        ) : (
          <StoriesView
            countryCode={storiesCountryCode}
            countryName={storiesCountryName}
            onBack={() => {
              setView('map');
              const params = new URLSearchParams(searchParams);
              params.delete('country');
              params.set('mode', heatMode);
              navigate(`/places/${profileSlug}/map?${params.toString()}`);
            }}
            onAddStory={(code, name) => handleAddStory(code, name, heatMode)}
            onStoryClick={(id) => navigate(`/places/${profileSlug}/story/${id}`)}
            refreshKey={refreshKey}
            profileSlug={profileSlug}
            mode={heatMode}
          />
        )}
      </Box>

      <AddStoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleStorySuccess}
        prefilledCountryCode={heatMode === 'stories' ? modalCountryCode : modalCountryCode || profileCountry}
        prefilledCountryName={heatMode === 'stories' ? modalCountryName : modalCountryName || alpha2ToName(profileCountry) || ''}
        prefilledAuthorCountryCode={heatMode === 'people' ? modalAuthorCountryCode : ''}
        prefilledAuthorCountryName={heatMode === 'people' ? modalAuthorCountryName : ''}
        // For people mode, use modalCountryCode/Name as author fields
        // handled in modal effect
        profileSlug={profileSlug}
        defaultAccessCode={accessCodeParam}
        onError={(msg) => setToast({ open: true, message: msg, severity: 'error' })}
      />

      <Fab
        color="primary"
        onClick={() => handleAddStory()}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 40 }}
        aria-label="leave a story"
      >
        <AddIcon />
      </Fab>

      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableScrollLock
      >
        <Box sx={{ p: 1 }}>
          <TimeFilter
            current={timeFilter}
            onChange={(val) => {
              setTimeFilter(val);
              setFilterAnchorEl(null);
            }}
            inline
          />
        </Box>
      </Popover>

      <Box
        component="footer"
        sx={{
          mt: 2,
          py: 2,
          px: { xs: 2, md: 4 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="body2" fontWeight={700}>Where Are You (WAY)</Typography>
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: 'pointer' }}
          onClick={goToSignup}
        >
          Create your map
        </Typography>
      </Box>
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
    </ThemeProvider>
  );
}

export default App;
