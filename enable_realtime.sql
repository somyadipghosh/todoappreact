-- Enable realtime for both tables
BEGIN;
  -- Check if the supabase_realtime publication exists
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;

  -- Add tables to the realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  ALTER PUBLICATION supabase_realtime ADD TABLE todos;
COMMIT; 