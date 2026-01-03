import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Story, HeatMode } from '../types';

export function useStories(
  countryCode?: string,
  refreshKey = 0,
  profileSlug = 'public',
  mode: HeatMode = 'stories',
  page = 1,
  perPage = 20,
  sort: 'newest' | 'oldest' = 'newest'
) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchStories() {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        stories?: Story[];
        total?: number;
      }>('get-stories', {
        body: { countryCode: countryCode?.toUpperCase(), profileSlug, mode, page, perPage, sort }
      });

      if (!error && data?.success && data.stories && isMounted) {
        setStories(data.stories);
        setTotal(data.total ?? data.stories.length);
      } else if (isMounted) {
        setStories([]);
        setTotal(0);
      }

      setLoading(false);
    }

    fetchStories();

    return () => {
      isMounted = false;
    };
  }, [countryCode, profileSlug, mode, refreshKey, page, perPage, sort]);

  return { stories, loading, total };
}
