/*
  # Playoff Challenge Database Schema

  1. New Tables
    - `playoff_users`
      - `id` (uuid, primary key)
      - `auth_id` (uuid, references auth.users)
      - `wallet_address` (text)
      - `created_at` (timestamptz)
      
    - `playoff_picks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references playoff_users)
      - `teams` (jsonb)
      - `champion` (text)
      - `submission_time` (timestamptz)
      - `last_modified` (timestamptz)
      - `bonus_multiplier` (numeric)
      - `locked` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `playoff_leaderboard`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references playoff_users)
      - `points` (integer)
      - `bonus_points` (integer)
      - `total_points` (integer)
      - `rank` (integer)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for admin access

  3. Functions
    - Calculate bonus multiplier
    - Update leaderboard
    - Lock picks after deadline
*/

-- Create playoff users table
CREATE TABLE playoff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users NOT NULL,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(auth_id)
);

-- Create playoff picks table
CREATE TABLE playoff_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES playoff_users NOT NULL,
  teams jsonb NOT NULL,
  champion text NOT NULL,
  submission_time timestamptz DEFAULT now(),
  last_modified timestamptz DEFAULT now(),
  bonus_multiplier numeric DEFAULT 1.0,
  locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_teams CHECK (jsonb_array_length(teams) = 12)
);

-- Create playoff leaderboard table
CREATE TABLE playoff_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES playoff_users NOT NULL,
  points integer DEFAULT 0,
  bonus_points integer DEFAULT 0,
  total_points integer DEFAULT 0,
  rank integer,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE playoff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoff_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoff_leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON playoff_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own data"
  ON playoff_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can read own picks"
  ON playoff_picks
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM playoff_users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own picks before lock date"
  ON playoff_picks
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM playoff_users WHERE auth_id = auth.uid()
    )
    AND NOT locked
    AND now() < '2023-12-04 23:59:59'::timestamptz
  );

CREATE POLICY "Users can read leaderboard"
  ON playoff_leaderboard
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to calculate bonus multiplier
CREATE OR REPLACE FUNCTION calculate_bonus_multiplier(submission_time timestamptz)
RETURNS numeric AS $$
DECLARE
  start_date timestamptz := '2023-08-01 00:00:00'::timestamptz;
  lock_date timestamptz := '2023-12-04 23:59:59'::timestamptz;
  bonus_max numeric := 0.5;
  total_window interval;
  time_remaining interval;
  fraction_remaining numeric;
BEGIN
  total_window := lock_date - start_date;
  time_remaining := lock_date - submission_time;
  
  -- Ensure submission is within valid window
  IF submission_time < start_date THEN
    RETURN 1 + bonus_max;
  ELSIF submission_time > lock_date THEN
    RETURN 1.0;
  END IF;
  
  -- Calculate linear decay
  fraction_remaining := EXTRACT(EPOCH FROM time_remaining) / EXTRACT(EPOCH FROM total_window);
  RETURN 1 + (bonus_max * fraction_remaining);
END;
$$ LANGUAGE plpgsql;

-- Create function to update picks with new multiplier
CREATE OR REPLACE FUNCTION update_picks_multiplier()
RETURNS trigger AS $$
BEGIN
  NEW.bonus_multiplier := calculate_bonus_multiplier(NEW.submission_time);
  NEW.last_modified := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for multiplier updates
CREATE TRIGGER update_picks_multiplier_trigger
  BEFORE INSERT OR UPDATE ON playoff_picks
  FOR EACH ROW
  EXECUTE FUNCTION update_picks_multiplier();

-- Create function to lock picks after deadline
CREATE OR REPLACE FUNCTION lock_picks_after_deadline()
RETURNS void AS $$
BEGIN
  UPDATE playoff_picks
  SET locked = true
  WHERE NOT locked
    AND now() >= '2023-12-04 23:59:59'::timestamptz;
END;
$$ LANGUAGE plpgsql;