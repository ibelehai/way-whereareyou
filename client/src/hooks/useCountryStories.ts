import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Story } from '../types';

export function useCountryStories(countryCode: string | null) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!countryCode) {
      setStories([]);
      return;
    }

    async function fetchStories() {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStories(data);
      }
      setLoading(false);
    }

    fetchStories();
  }, [countryCode]);

  return { stories, loading };
}
