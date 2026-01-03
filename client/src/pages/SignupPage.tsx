import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { supabase } from '../lib/supabaseClient';
import { countryOptions, alpha2ToName } from '../lib/countryCodes';

export function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    slug: '',
    name: '',
    email: '',
    password: '',
    country: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Register profile + user
      const { data, error: fnError } = await supabase.functions.invoke<{ success: boolean; slug?: string; error?: string }>('register-profile', {
        body: {
          slug: form.slug.trim().toLowerCase(),
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          country: form.country.trim().toUpperCase()
        }
      });

      if (fnError) throw fnError;
      if (!data?.success || !data.slug) {
        throw new Error(data?.error || 'Failed to sign up');
      }

      // Sign in to create session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password
      });

      if (signInError) throw signInError;

      navigate(`/places/${data.slug}/map`);
    } catch (err: any) {
      setError(err?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 460, boxShadow: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h4" fontWeight={700}>
                Create your map
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pick a unique slug to get your own world map and manage stories.
              </Typography>
            </Stack>

            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
              <TextField
                label="Slug"
                placeholder="your-map"
                value={form.slug}
                onChange={handleChange('slug')}
                required
                inputProps={{ pattern: '[a-z0-9-]{3,30}' }}
                helperText="3-30 chars, lowercase letters, numbers, or hyphens."
                fullWidth
              />
              <TextField
                label="Country code"
                placeholder="US"
                value={form.country}
                onChange={handleChange('country')}
                inputProps={{ maxLength: 2 }}
                helperText="2-letter country code (optional)"
                fullWidth
              />
              <Autocomplete
                options={countryOptions}
                getOptionLabel={(opt) => `${opt.name} (${opt.code})`}
                isOptionEqualToValue={(a, b) => a.code === b.code}
                value={
                  countryOptions.find((c) => c.code === form.country.toUpperCase()) ||
                  (form.country
                    ? { code: form.country.toUpperCase(), name: alpha2ToName(form.country) || form.country.toUpperCase() }
                    : null)
                }
                onChange={(_, val) => setForm((prev) => ({ ...prev, country: val?.code || '' }))}
                renderInput={(params) => <TextField {...params} label="Select country (optional)" />}
              />
              <TextField
                label="Name"
                placeholder="My Travel Map"
                value={form.name}
                onChange={handleChange('name')}
                required
                fullWidth
              />
              <TextField
                label="Email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
                type="email"
                required
                fullWidth
              />
              <TextField
                label="Password"
                value={form.password}
                onChange={handleChange('password')}
                type="password"
                required
                inputProps={{ minLength: 6 }}
                fullWidth
              />

              {error && (
                <Alert severity="error" variant="outlined">
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? 'Creating...' : 'Create my map'}
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Already have a map?{' '}
              <Link component="button" onClick={() => navigate('/')} underline="hover">
                Go to maps
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
