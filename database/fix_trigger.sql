-- Fix trigger issue - drop and recreate
DROP TRIGGER IF EXISTS update_social_connections_updated_at ON social_connections;

-- Recreate the trigger
CREATE TRIGGER update_social_connections_updated_at 
  BEFORE UPDATE ON social_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

