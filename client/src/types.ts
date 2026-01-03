export interface Story {
  id: string;
  country_code: string;
  country_name: string;
  author_country_code: string;
  author_country_name: string;
  author_name: string;
  author_age?: number | null;
  story?: string | null;
  photo_url: string | null;
  access_code: string;
  created_at: string;
}

export interface CountryHeat {
  country_code: string;
  count: number;
}

export type TimeFilter = 'today' | 'month' | 'all';
export type HeatMode = 'stories' | 'people';

export interface AccessCodeValidation {
  success: boolean;
  error?: string;
  story_id?: string;
}
