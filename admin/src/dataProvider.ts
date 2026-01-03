import type { DataProvider, Identifier } from 'react-admin';
import { supabase } from './supabaseClient';
import { getStoredProfile } from './authProvider';

function requireProfile() {
  const profile = getStoredProfile();
  if (!profile) throw new Error('Not authenticated');
  return profile;
}
//
//

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { profileId } = requireProfile();
    if (resource === 'stories') {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = (data || []).map((row) => ({ ...row, id: row.id as Identifier }));
      return { data: records, total: records.length };
    }

    if (resource === 'access_codes') {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = (data || []).map((row) => ({ ...row, id: row.code as Identifier }));
      return { data: records, total: records.length };
    }

    throw new Error('Unsupported resource');
  },

  delete: async (resource, params) => {
    const { profileId } = requireProfile();
    if (resource !== 'stories') throw new Error('Unsupported resource');

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', params.id)
      .eq('profile_id', profileId);

    if (error) throw error;

    return { data: { ...(params.previousData as any), id: params.id as Identifier } };
  },

  deleteMany: async (resource, params) => {
    const { profileId } = requireProfile();
    if (resource !== 'stories') throw new Error('Unsupported resource');

    const { error } = await supabase
      .from('stories')
      .delete()
      .in('id', params.ids)
      .eq('profile_id', profileId);

    if (error) throw error;

    return { data: params.ids };
  },

  getOne: async (resource, params) => {
    const { profileId } = requireProfile();
    if (resource === 'stories') {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', params.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Not found');

      return { data: { ...data, id: data.id as Identifier } };
    }

    if (resource === 'profiles') {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, slug, name, primary_color, country')
        .eq('id', profileId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Not found');
      return { data: { ...data, id: data.id as Identifier } };
    }

    if (resource === 'access_codes') {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', params.id)
        .eq('profile_id', profileId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Not found');
      return { data: { ...data, id: data.code as Identifier } };
    }

    throw new Error('Unsupported resource');
  },

  getMany: () => Promise.reject(),
  getManyReference: () => Promise.reject(),

  update: async (resource, params) => {
    const { profileId } = requireProfile();
    if (resource === 'profiles') {
      const payload = { ...params.data };
      delete (payload as any).id;
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profileId)
        .select('id, slug, name, primary_color, country')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Update failed');
    
      return { data: { ...data, id: data.id as Identifier } as any };
    }

    throw new Error('Unsupported resource');
  },

  updateMany: () => Promise.reject(),
  create: async (resource, params) => {
    const { profileId } = requireProfile();
    if (resource === 'access_codes') {
      const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
      const { slug } = getStoredProfile() || {};
      const targetSlug = slug || 'public';
      const codeValue = String(params.data.code || '').toUpperCase();
      const linkUrl = params.data.link_url || `${siteUrl}/places/${targetSlug}?code=${codeValue}`;

      const payload: any = {
        code: codeValue,
        usage_limit: params.data.usage_limit ?? null,
        is_active: true,
        profile_id: profileId,
        link_url: linkUrl
      };

      const { data, error } = await supabase
        .from('access_codes')
        .insert(payload)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Create failed');

      return { data: { ...data, id: data.code as Identifier } };
    }

    throw new Error('Unsupported resource');
  },
};
