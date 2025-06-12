/*
  # Create tables and fix user creation

  1. New Tables
    - `Users` - User privacy settings and metadata
    - `Profiles` - User profile information
    - `Notifications` - User notifications system
    - `Match_Requests` - Friend/match request system
    - `Blocked_Users` - User blocking functionality

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create secure functions for user operations

  3. Functions
    - handle_new_user() - Automatically create profile when user signs up
    - get_match_suggestions() - Get potential matches
    - create_match_or_request() - Handle match requests
    - get_my_matches() - Get user's matches
    - update_match_request_status() - Accept/decline requests
    - block_user() - Block functionality
*/

-- Create Users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Users" (
  "User_ID" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "User_priset_is_private" boolean DEFAULT false,
  "Created_At" timestamptz DEFAULT now(),
  "Updated_At" timestamptz DEFAULT now()
);

-- Create Profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Profiles" (
  "Profile_ID" serial PRIMARY KEY,
  "User_ID" uuid REFERENCES public."Users"("User_ID") ON DELETE CASCADE,
  "Profile_Username" text,
  "Profile_Picture_URL" text,
  "Profile_Bio" text,
  "Profile_Academic_Interes" text,
  "Profile_Non_Academic_Interes" text,
  "Profile_Looking_For" text,
  "Profile_Birthdate" date,
  "Created_At" timestamptz DEFAULT now(),
  "Updated_At" timestamptz DEFAULT now(),
  UNIQUE("User_ID")
);

-- Create Notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Notifications" (
  "Notification_ID" serial PRIMARY KEY,
  "User_ID" uuid REFERENCES public."Users"("User_ID") ON DELETE CASCADE,
  "Notification_Type" text NOT NULL,
  "Notification_Content" text NOT NULL,
  "Is_Read" boolean DEFAULT false,
  "Created_At" timestamptz DEFAULT now()
);

-- Create Match_Requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Match_Requests" (
  "Request_ID" serial PRIMARY KEY,
  "Requester_ID" uuid REFERENCES public."Users"("User_ID") ON DELETE CASCADE,
  "Receiver_ID" uuid REFERENCES public."Users"("User_ID") ON DELETE CASCADE,
  "Status" text DEFAULT 'pending' CHECK ("Status" IN ('pending', 'accepted', 'declined')),
  "Created_At" timestamptz DEFAULT now(),
  "Updated_At" timestamptz DEFAULT now(),
  UNIQUE("Requester_ID", "Receiver_ID")
);

-- Create Blocked_Users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Blocked_Users" (
  "Block_ID" serial PRIMARY KEY,
  "Blocker_ID" uuid REFERENCES public."Users"("User_ID") ON DELETE CASCADE,
  "Blocked_ID" uuid REFERENCES public."Users"("User_ID") ON DELETE CASCADE,
  "Created_At" timestamptz DEFAULT now(),
  UNIQUE("Blocker_ID", "Blocked_ID")
);

-- Enable RLS on all tables
ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Match_Requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Blocked_Users" ENABLE ROW LEVEL SECURITY;

-- Create policies for Users table
DROP POLICY IF EXISTS "Users can read own data" ON public."Users";
CREATE POLICY "Users can read own data"
  ON public."Users"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "User_ID");

DROP POLICY IF EXISTS "Users can update own data" ON public."Users";
CREATE POLICY "Users can update own data"
  ON public."Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "User_ID");

-- Create policies for Profiles table
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public."Profiles";
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public."Profiles"
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public."Profiles";
CREATE POLICY "Users can update own profile"
  ON public."Profiles"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "User_ID");

-- Create policies for Notifications table
DROP POLICY IF EXISTS "Users can read own notifications" ON public."Notifications";
CREATE POLICY "Users can read own notifications"
  ON public."Notifications"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "User_ID");

DROP POLICY IF EXISTS "Users can update own notifications" ON public."Notifications";
CREATE POLICY "Users can update own notifications"
  ON public."Notifications"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "User_ID");

-- Create policies for Match_Requests table
DROP POLICY IF EXISTS "Users can read own match requests" ON public."Match_Requests";
CREATE POLICY "Users can read own match requests"
  ON public."Match_Requests"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "Requester_ID" OR auth.uid() = "Receiver_ID");

DROP POLICY IF EXISTS "Users can create match requests" ON public."Match_Requests";
CREATE POLICY "Users can create match requests"
  ON public."Match_Requests"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "Requester_ID");

DROP POLICY IF EXISTS "Users can update match requests" ON public."Match_Requests";
CREATE POLICY "Users can update match requests"
  ON public."Match_Requests"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "Receiver_ID");

-- Create policies for Blocked_Users table
DROP POLICY IF EXISTS "Users can read own blocks" ON public."Blocked_Users";
CREATE POLICY "Users can read own blocks"
  ON public."Blocked_Users"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "Blocker_ID");

DROP POLICY IF EXISTS "Users can create blocks" ON public."Blocked_Users";
CREATE POLICY "Users can create blocks"
  ON public."Blocked_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "Blocker_ID");

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- First insert into Users table
  INSERT INTO public."Users" ("User_ID", "User_priset_is_private")
  VALUES (NEW.id, false)
  ON CONFLICT ("User_ID") DO NOTHING;
  
  -- Then insert into Profiles table
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
  )
  ON CONFLICT ("User_ID") DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error in handle_new_user(): %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get match suggestions
CREATE OR REPLACE FUNCTION public.get_match_suggestions(current_user_id uuid)
RETURNS TABLE (
  profile_id integer,
  users_user_id uuid,
  profile_username text,
  profile_picture_url text,
  profile_bio text,
  profile_non_academic_interes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p."Profile_ID",
    p."User_ID",
    p."Profile_Username",
    p."Profile_Picture_URL",
    p."Profile_Bio",
    p."Profile_Non_Academic_Interes"
  FROM public."Profiles" p
  JOIN public."Users" u ON p."User_ID" = u."User_ID"
  WHERE p."User_ID" != current_user_id
    AND p."User_ID" NOT IN (
      SELECT "Receiver_ID" FROM public."Match_Requests" 
      WHERE "Requester_ID" = current_user_id
    )
    AND p."User_ID" NOT IN (
      SELECT "Requester_ID" FROM public."Match_Requests" 
      WHERE "Receiver_ID" = current_user_id
    )
    AND p."User_ID" NOT IN (
      SELECT "Blocked_ID" FROM public."Blocked_Users" 
      WHERE "Blocker_ID" = current_user_id
    )
    AND p."User_ID" NOT IN (
      SELECT "Blocker_ID" FROM public."Blocked_Users" 
      WHERE "Blocked_ID" = current_user_id
    )
  ORDER BY p."Created_At" DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle match requests
CREATE OR REPLACE FUNCTION public.create_match_or_request(requester_id uuid, receiver_id uuid)
RETURNS text AS $$
DECLARE
  receiver_is_private boolean;
  existing_request_id integer;
BEGIN
  -- Check if receiver has private account
  SELECT "User_priset_is_private" INTO receiver_is_private
  FROM public."Users"
  WHERE "User_ID" = receiver_id;
  
  -- Check for existing request in reverse direction
  SELECT "Request_ID" INTO existing_request_id
  FROM public."Match_Requests"
  WHERE "Requester_ID" = receiver_id AND "Receiver_ID" = requester_id AND "Status" = 'pending';
  
  IF existing_request_id IS NOT NULL THEN
    -- Auto-match if there's a pending request from the other user
    UPDATE public."Match_Requests"
    SET "Status" = 'accepted', "Updated_At" = now()
    WHERE "Request_ID" = existing_request_id;
    
    -- Create notifications for both users
    INSERT INTO public."Notifications" ("User_ID", "Notification_Type", "Notification_Content")
    VALUES 
      (requester_id, 'match_created', 'You have a new match!'),
      (receiver_id, 'match_created', 'You have a new match!');
    
    RETURN 'Match created!';
  ELSE
    -- Create new request
    INSERT INTO public."Match_Requests" ("Requester_ID", "Receiver_ID", "Status")
    VALUES (requester_id, receiver_id, 'pending');
    
    -- Create notification for receiver
    INSERT INTO public."Notifications" ("User_ID", "Notification_Type", "Notification_Content")
    SELECT receiver_id, 'match_request', 
           'You have a new match request from ' || p."Profile_Username" || ' [' || currval('public."Match_Requests_Request_ID_seq"') || ']'
    FROM public."Profiles" p
    WHERE p."User_ID" = requester_id;
    
    IF receiver_is_private THEN
      RETURN 'Match request sent! They will be notified.';
    ELSE
      RETURN 'Match request sent!';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user matches
CREATE OR REPLACE FUNCTION public.get_my_matches(current_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  profile_picture_url text,
  bio text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p."User_ID",
    p."Profile_Username",
    p."Profile_Picture_URL",
    p."Profile_Bio"
  FROM public."Profiles" p
  WHERE p."User_ID" IN (
    SELECT CASE 
      WHEN mr."Requester_ID" = current_user_id THEN mr."Receiver_ID"
      ELSE mr."Requester_ID"
    END
    FROM public."Match_Requests" mr
    WHERE (mr."Requester_ID" = current_user_id OR mr."Receiver_ID" = current_user_id)
      AND mr."Status" = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update match request status
CREATE OR REPLACE FUNCTION public.update_match_request_status(request_id_input integer, new_status text)
RETURNS void AS $$
DECLARE
  requester_id_var uuid;
  receiver_id_var uuid;
BEGIN
  -- Get the requester and receiver IDs
  SELECT "Requester_ID", "Receiver_ID" INTO requester_id_var, receiver_id_var
  FROM public."Match_Requests"
  WHERE "Request_ID" = request_id_input;
  
  -- Update the request status
  UPDATE public."Match_Requests"
  SET "Status" = new_status, "Updated_At" = now()
  WHERE "Request_ID" = request_id_input;
  
  -- Create notification for requester
  IF new_status = 'accepted' THEN
    INSERT INTO public."Notifications" ("User_ID", "Notification_Type", "Notification_Content")
    VALUES (requester_id_var, 'match_created', 'Your match request was accepted!');
  ELSIF new_status = 'declined' THEN
    INSERT INTO public."Notifications" ("User_ID", "Notification_Type", "Notification_Content")
    VALUES (requester_id_var, 'match_declined', 'Your match request was declined.');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to block users
CREATE OR REPLACE FUNCTION public.block_user(blocker_id uuid, blocked_id uuid)
RETURNS text AS $$
BEGIN
  -- Insert block record
  INSERT INTO public."Blocked_Users" ("Blocker_ID", "Blocked_ID")
  VALUES (blocker_id, blocked_id)
  ON CONFLICT ("Blocker_ID", "Blocked_ID") DO NOTHING;
  
  -- Remove any existing match requests between these users
  DELETE FROM public."Match_Requests"
  WHERE ("Requester_ID" = blocker_id AND "Receiver_ID" = blocked_id)
     OR ("Requester_ID" = blocked_id AND "Receiver_ID" = blocker_id);
  
  RETURN 'User blocked successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_match_suggestions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_match_or_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_matches(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_match_request_status(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(uuid, uuid) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public."Users" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public."Profiles" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public."Notifications" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public."Match_Requests" TO authenticated;
GRANT SELECT, INSERT ON public."Blocked_Users" TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;