-- Custom Scripts and Analytics Database Schema
-- Execute this in your Supabase SQL Editor

-- Table for storing custom detection scripts
CREATE TABLE custom_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  script_type VARCHAR(50) DEFAULT 'python', -- 'python', 'javascript'
  script_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'stopped', -- 'running', 'stopped', 'error'
  process_id VARCHAR(255), -- For tracking background processes
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing analytics data from scripts
CREATE TABLE analytics_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES custom_scripts(id) ON DELETE CASCADE,
  detection_type VARCHAR(100) NOT NULL, -- 'face', 'person', 'motion', etc.
  detected_count INTEGER DEFAULT 0,
  confidence FLOAT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_custom_scripts_user_id ON custom_scripts(user_id);
CREATE INDEX idx_custom_scripts_device_id ON custom_scripts(device_id);
CREATE INDEX idx_custom_scripts_status ON custom_scripts(status);

CREATE INDEX idx_analytics_data_user_id ON analytics_data(user_id);
CREATE INDEX idx_analytics_data_device_id ON analytics_data(device_id);
CREATE INDEX idx_analytics_data_script_id ON analytics_data(script_id);
CREATE INDEX idx_analytics_data_timestamp ON analytics_data(timestamp);
CREATE INDEX idx_analytics_data_detection_type ON analytics_data(detection_type);

-- RLS Policies for security
ALTER TABLE custom_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own scripts
CREATE POLICY "Users can manage own scripts" ON custom_scripts
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own analytics data
CREATE POLICY "Users can manage own analytics" ON analytics_data
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for custom_scripts
CREATE TRIGGER update_custom_scripts_updated_at 
    BEFORE UPDATE ON custom_scripts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for analytics summary
CREATE VIEW analytics_summary AS
SELECT 
  device_id,
  script_id,
  detection_type,
  DATE_TRUNC('hour', timestamp) as hour,
  SUM(detected_count) as total_detections,
  AVG(confidence) as avg_confidence,
  COUNT(*) as event_count
FROM analytics_data
GROUP BY device_id, script_id, detection_type, DATE_TRUNC('hour', timestamp);
