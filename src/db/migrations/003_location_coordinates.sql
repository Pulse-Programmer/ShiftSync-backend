ALTER TABLE locations ADD COLUMN latitude DECIMAL(10, 7);
ALTER TABLE locations ADD COLUMN longitude DECIMAL(10, 7);

-- Seed coordinates for existing locations
UPDATE locations SET latitude = 40.7128000, longitude = -74.0060000 WHERE name = 'Coastal Eats Downtown';
UPDATE locations SET latitude = 40.7549000, longitude = -73.9840000 WHERE name = 'Coastal Eats Midtown';
UPDATE locations SET latitude = 34.0195000, longitude = -118.4912000 WHERE name = 'Coastal Eats Westside';
UPDATE locations SET latitude = 32.7157000, longitude = -117.1611000 WHERE name = 'Coastal Eats Beachfront';
