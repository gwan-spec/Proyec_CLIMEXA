import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  elevation: number | null;
  terrain_type: string;
  image_url: string | null;
  created_at: string;
};

export type AstronomicalEvent = {
  id: string;
  event_type: string;
  event_date: string;
  title: string;
  description: string | null;
  visibility_percentage: number;
  best_viewing_time: string | null;
  recommended_location_id: string | null;
  recommendations: {
    items?: string[];
    what_to_bring?: string[];
  };
  created_at: string;
};

export type PlannedEvent = {
  id: string;
  user_id: string;
  location_id: string | null;
  event_type: string;
  event_date: string;
  event_time: string | null;
  title: string;
  description: string | null;
  weather_prediction: any;
  ai_recommendations: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type LocationReview = {
  id: string;
  location_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  visit_date: string | null;
  weather_conditions: string | null;
  photos: string[];
  created_at: string;
};

export type WeatherAlert = {
  id: string;
  location_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
};
