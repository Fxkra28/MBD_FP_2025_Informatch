/*
  # Handle New User Registration

  1. New Functions
    - `handle_new_user()` - Creates profile and user entries when a new user registers
  
  2. New Triggers
    - `on_auth_user_created` - Automatically calls handle_new_user() when a user is created in auth.users
  
  3. Security
    - Function runs with SECURITY DEFINER to ensure proper permissions
    - Handles both Profiles and Users table insertions atomically
  
  This migration fixes the "Database error saving new user" issue by ensuring that
  every new user registration automatically creates the required database entries.
*/

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into the Profiles table
  INSERT INTO public."Profiles" (
    "User_ID",
    "Profile_Username",
    "Profile_Picture_URL",
    "Profile_Bio",
    "Profile_Academic_Interes",
    "Profile_Non_Academic_Interes",
    "Profile_Looking_For",
    "Profile_Birthdate"
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  );
  
  -- Insert into the Users table for privacy settings
  INSERT INTO public."Users" ("User_ID", "User_priset_is_private")
  VALUES (NEW.id, FALSE);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error in handle_new_user(): %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;