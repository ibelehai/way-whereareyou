import { Admin, Resource, List, Datagrid, TextField, DateField, DeleteButton, Show, SimpleShowLayout, RichTextField, ImageField, useRecordContext, useRedirect, useCheckAuth } from 'react-admin';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, Dialog, DialogContent, Box, createTheme } from '@mui/material';
import { authProvider, getStoredProfile } from './authProvider';
import { dataProvider } from './dataProvider';
import './index.css';
import { ProfileEdit } from './ProfileEdit';
import { AccessCodeCreate, AccessCodeList, AccessCodeShow } from './AccessCodes';
//
//
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#45803b' },
    background: {
      default: '#f6f6f1',
      paper: '#f6f6f1'
    }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Lexend", "Inter", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none' }
  }
});

const PhotoPreviewField = () => {
  const record = useRecordContext();
  const [open, setOpen] = useState(false);
  if (!record?.photo_url) return null;

  return (
    <>
      <Box onClick={() => setOpen(true)} sx={{ display: 'inline-flex', cursor: 'pointer' }}>
        <ImageField
          source="photo_url"
          label="Photo Preview"
          sx={{ '& img': { maxWidth: 240, maxHeight: 160, objectFit: 'cover' } }}
        />
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'black' }}>
          <Box component="img" src={record.photo_url} alt="Full size" sx={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>
    </>
  );
};

const StoryList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="author_name" label="Author" />
      <TextField source="author_country_code" label="From" />
      <TextField source="country_code" label="Story Country" />
      <TextField source="story" label="Story" />
      <DateField source="created_at" label="Created" />
      <DeleteButton />
    </Datagrid>
  </List>
);

const StoryShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="author_name" label="Author" />
      <TextField source="author_country_name" label="Author Country" />
      <TextField source="author_country_code" label="Author Code" />
      <TextField source="country_name" label="Story Country" />
      <TextField source="country_code" label="Story Code" />
      <RichTextField source="story" label="Story" />
      <TextField source="photo_url" label="Photo URL" />
      <TextField source="access_code" label="Access Code" />
      <DateField source="created_at" label="Created" />
      <PhotoPreviewField />
    </SimpleShowLayout>
  </Show>
);

const HomeRedirect = () => {
  const checkAuth = useCheckAuth();
  const redirect = useRedirect();
  const [status, setStatus] = useState<'pending' | 'authenticated' | 'unauthenticated'>('pending');

  useEffect(() => {
    let active = true;

    checkAuth({}, false)
      .then(() => {
        if (!active) return;
        setStatus('authenticated');
        redirect('/profiles');
      })
      .catch(() => {
        if (!active) return;
        setStatus('unauthenticated');
        redirect('/login');
      });

    return () => {
      active = false;
    };
  }, [checkAuth, redirect]);

  if (status === 'pending') {
    return (
      <Box sx={{ p: 3 }}>
        Checking authentication...
      </Box>
    );
  }

  return null;
};

const ProfileRedirect = () => {
  const checkAuth = useCheckAuth();
  const redirect = useRedirect();
  const [status, setStatus] = useState<'pending' | 'authenticated' | 'unauthenticated'>('pending');

  useEffect(() => {
    let active = true;

    checkAuth({}, false)
      .then(() => {
        if (!active) return;
        setStatus('authenticated');
        const stored = getStoredProfile();
        if (stored?.profileId) {
          redirect(`/profiles/${stored.profileId}`);
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus('unauthenticated');
        redirect('/login');
      });

    return () => {
      active = false;
    };
  }, [checkAuth, redirect]);

  return (
    <Box sx={{ p: 3 }}>
      {status === 'pending' ? 'Checking authentication...' : 'Loading profile...'}
    </Box>
  );
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Admin authProvider={authProvider} dataProvider={dataProvider} dashboard={HomeRedirect}>
        <Resource name="profiles" list={ProfileRedirect} edit={ProfileEdit} options={{ label: 'Profile' }} />
        <Resource name="stories" list={StoryList} show={StoryShow} />
        <Resource
          name="access_codes"
          list={AccessCodeList}
          create={AccessCodeCreate}
          show={AccessCodeShow}
          options={{ label: 'Access Codes' }}
        />
      </Admin>
    </ThemeProvider>
  </React.StrictMode>
);
