-- Fix search path for profile creation trigger
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  desired_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  desired_username := COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substr(NEW.id::text, 1, 8));
  final_username := desired_username;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := desired_username || '_' || counter;
  END LOOP;

  INSERT INTO profiles (id, username)
  VALUES (NEW.id, final_username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
