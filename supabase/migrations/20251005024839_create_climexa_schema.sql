/*
  # Create CLIMEXA Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `elevation` (decimal, optional)
      - `terrain_type` (text)
      - `image_url` (text, optional)
      - `created_at` (timestamp)
    
    - `astronomical_events`
      - `id` (uuid, primary key)
      - `event_type` (text) - full_moon, new_moon, eclipse, meteor_shower, etc.
      - `event_date` (timestamp)
      - `title` (text)
      - `description` (text)
      - `visibility_percentage` (integer)
      - `best_viewing_time` (text)
      - `recommended_location_id` (uuid, optional foreign key to locations)
      - `recommendations` (jsonb) - structured tips and requirements
      - `created_at` (timestamp)
    
    - `planned_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `location_id` (uuid, references locations)
      - `event_type` (text) - hiking, camping, photography, etc.
      - `event_date` (timestamp)
      - `event_time` (time)
      - `title` (text)
      - `description` (text)
      - `weather_prediction` (jsonb)
      - `ai_recommendations` (text)
      - `status` (text) - planned, completed, cancelled
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `location_reviews`
      - `id` (uuid, primary key)
      - `location_id` (uuid, references locations)
      - `user_id` (uuid, references profiles)
      - `rating` (integer) - 1 to 5
      - `comment` (text)
      - `visit_date` (date)
      - `weather_conditions` (text)
      - `photos` (jsonb) - array of photo URLs
      - `created_at` (timestamp)
    
    - `weather_alerts`
      - `id` (uuid, primary key)
      - `location_id` (uuid, references locations)
      - `alert_type` (text) - storm, wind, temperature, etc.
      - `severity` (text) - low, medium, high
      - `message` (text)
      - `valid_from` (timestamp)
      - `valid_until` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
    - Public read access for locations and astronomical events
    - Community features require authentication
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  elevation decimal(10, 2),
  terrain_type text DEFAULT 'general',
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create astronomical_events table
CREATE TABLE IF NOT EXISTS astronomical_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_date timestamptz NOT NULL,
  title text NOT NULL,
  description text,
  visibility_percentage integer DEFAULT 0,
  best_viewing_time text,
  recommended_location_id uuid REFERENCES locations(id),
  recommendations jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE astronomical_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view astronomical events"
  ON astronomical_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create astronomical events"
  ON astronomical_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create planned_events table
CREATE TABLE IF NOT EXISTS planned_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id),
  event_type text NOT NULL,
  event_date date NOT NULL,
  event_time time,
  title text NOT NULL,
  description text,
  weather_prediction jsonb DEFAULT '{}'::jsonb,
  ai_recommendations text,
  status text DEFAULT 'planned',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE planned_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planned events"
  ON planned_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own planned events"
  ON planned_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planned events"
  ON planned_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own planned events"
  ON planned_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create location_reviews table
CREATE TABLE IF NOT EXISTS location_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  visit_date date,
  weather_conditions text,
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE location_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON location_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON location_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON location_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON location_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create weather_alerts table
CREATE TABLE IF NOT EXISTS weather_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id),
  alert_type text NOT NULL,
  severity text DEFAULT 'medium',
  message text NOT NULL,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active alerts"
  ON weather_alerts FOR SELECT
  TO authenticated
  USING (valid_until > now());

CREATE POLICY "Authenticated users can create alerts"
  ON weather_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_astronomical_events_date ON astronomical_events(event_date);
CREATE INDEX IF NOT EXISTS idx_planned_events_user ON planned_events(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_events_date ON planned_events(event_date);
CREATE INDEX IF NOT EXISTS idx_location_reviews_location ON location_reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_location ON weather_alerts(location_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_valid ON weather_alerts(valid_until);

-- Insert sample locations in Bolivia
INSERT INTO locations (name, description, latitude, longitude, elevation, terrain_type, image_url) VALUES
  ('Parque Tunari', 'Parque nacional con vistas panorámicas y senderos para caminatas', -17.2833, -66.1500, 4200, 'mountain', 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg'),
  ('Toro Toro', 'Parque nacional conocido por sus formaciones rocosas y cañones', -18.1333, -65.7667, 2700, 'canyon', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'),
  ('Cristo de la Concordia', 'Mirador icónico con vistas de toda la ciudad de Cochabamba', -17.3895, -66.1568, 2840, 'viewpoint', 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg'),
  ('Valle de la Luna', 'Formaciones geológicas únicas ideales para fotografía', -16.5667, -68.0833, 3400, 'desert', 'https://images.pexels.com/photos/1181292/pexels-photo-1181292.jpeg')
ON CONFLICT DO NOTHING;

-- Insert sample astronomical events
INSERT INTO astronomical_events (event_type, event_date, title, description, visibility_percentage, best_viewing_time, recommendations) VALUES
  ('full_moon', '2025-10-17 20:12:00', 'Luna Llena de Octubre', 'Luna llena visible con condiciones óptimas de observación', 90, '20:12 - 23:00', '{"items": ["Buscar lugares elevados", "Llevar cámara con trípode", "Evitar contaminación lumínica"], "what_to_bring": ["Binoculares", "Abrigo", "Linterna roja"]}'),
  ('meteor_shower', '2025-11-17 02:00:00', 'Leónidas 2025', 'Lluvia de meteoros con hasta 15 meteoros por hora', 75, '02:00 - 05:00', '{"items": ["Observar después de medianoche", "Acostarse en posición cómoda", "Dejar adaptar la vista 20 minutos"], "what_to_bring": ["Saco de dormir", "Colchoneta", "Bebidas calientes"]}'),
  ('new_moon', '2025-10-02 18:00:00', 'Luna Nueva', 'Noche ideal para observación de cielo profundo', 95, '20:00 - 04:00', '{"items": ["Mejor momento para ver galaxias y nebulosas", "Usar telescopio si está disponible"], "what_to_bring": ["Telescopio", "Mapa estelar", "Luz roja"]}')
ON CONFLICT DO NOTHING;