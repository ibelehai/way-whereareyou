import { useState, useEffect } from 'react';
import type { CountryHeat, TimeFilter, HeatMode } from '../types';

import { supabase } from '../lib/supabaseClient';

export function useCountryHeat(timeFilter: TimeFilter, refreshKey = 0, profileSlug = 'public', mode: HeatMode = 'stories') {
  const [heatData, setHeatData] = useState<CountryHeat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHeat() {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke<{ success: boolean; heat?: CountryHeat[] }>('get-country-heat', {
        body: { timeFilter, profileSlug, mode }
      });

      if (!error && data?.success && data.heat) {
        setHeatData(data.heat);
      } else {
        setHeatData([]);
      }

      setLoading(false);
    }

    fetchHeat();
  }, [timeFilter, refreshKey, profileSlug, mode]);

  return { heatData, loading };
}
