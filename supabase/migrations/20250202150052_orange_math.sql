/*
  # Create betting predictions table

  1. New Tables
    - `betting_predictions`
      - `id` (uuid, primary key)
      - `prediction` (text)
      - `confidence` (numeric)
      - `analysis` (text)
      - `estimated_value` (numeric)
      - `created_at` (timestamptz)
      - `result` (text, nullable)
      - `was_correct` (boolean, nullable)

  2. Security
    - Enable RLS
    - Add policy for admin access
*/

-- Create betting predictions table
CREATE TABLE IF NOT EXISTS betting_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction text NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  analysis text NOT NULL,
  estimated_value numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  result text,
  was_correct boolean,
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Enable RLS
ALTER TABLE betting_predictions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage betting predictions"
  ON betting_predictions
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.email() = ANY(string_to_array(current_setting('app.admin_emails'), ','))
  ));