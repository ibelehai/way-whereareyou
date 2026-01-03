import type { AuthProvider } from 'react-admin';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'dm_profile';

type StoredProfile = {
  profileId: string;
  slug: string;
};

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const email = username;
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !signInData.session) {
      throw new Error(error?.message || 'Invalid credentials');
    }
    const user = signInData.session.user;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, slug')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error(profileError?.message || 'Profile not found for this user');
    }

    const stored: StoredProfile = { profileId: profile.id, slug: profile.slug };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return Promise.resolve();
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    return Promise.resolve();
  },

  checkAuth: async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return Promise.reject();
    const { data } = await supabase.auth.getSession();
    if (data.session) return Promise.resolve();
    localStorage.removeItem(STORAGE_KEY);
    return Promise.reject();
  },

  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
};

export function getStoredProfile(): StoredProfile | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}
