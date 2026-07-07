-- =============================================
-- Statistical: Initial Schema Migration
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer AS $$
  SELECT coalesce(x, 0);
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION decrement(x integer)
RETURNS integer AS $$
  SELECT greatest(coalesce(x, 0) - 1, 0);
$$ LANGUAGE sql IMMUTABLE;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PROFILES
-- =============================================

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  display_name    TEXT CHECK (char_length(display_name) <= 50),
  bio             TEXT CHECK (char_length(bio) <= 500),
  avatar_url      TEXT,
  cover_url       TEXT,
  website         TEXT CHECK (char_length(website) <= 200),
  location        TEXT CHECK (char_length(location) <= 100),
  post_count      INTEGER NOT NULL DEFAULT 0,
  follower_count  INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  like_count      INTEGER NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  is_analyst      BOOLEAN NOT NULL DEFAULT false,
  is_banned       BOOLEAN NOT NULL DEFAULT false,
  is_suspended    BOOLEAN NOT NULL DEFAULT false,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'superadmin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector   tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(username, '') || ' ' || coalesce(display_name, '') || ' ' || coalesce(bio, ''))
  ) STORED
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_search ON profiles USING GIN(search_vector);
CREATE INDEX idx_profiles_follower_count ON profiles(follower_count DESC);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX idx_profiles_role ON profiles(role) WHERE role IN ('moderator', 'admin', 'superadmin');

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Admin and moderator check functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'superadmin')
  );
$$ LANGUAGE sql STABLE;

-- =============================================
-- POSTS
-- =============================================

CREATE TABLE posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL CHECK (char_length(title) >= 10 AND char_length(title) <= 200),
  body              TEXT CHECK (char_length(body) <= 10000),
  body_html         TEXT,
  direction         TEXT CHECK (direction IN ('bullish', 'bearish', 'neutral')),
  confidence        SMALLINT CHECK (confidence >= 1 AND confidence <= 10),
  has_images        BOOLEAN NOT NULL DEFAULT false,
  like_count        INTEGER NOT NULL DEFAULT 0,
  comment_count     INTEGER NOT NULL DEFAULT 0,
  bookmark_count    INTEGER NOT NULL DEFAULT 0,
  view_count        INTEGER NOT NULL DEFAULT 0,
  is_published      BOOLEAN NOT NULL DEFAULT true,
  is_edited         BOOLEAN NOT NULL DEFAULT false,
  is_pinned         BOOLEAN NOT NULL DEFAULT false,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector     tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED
);

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX idx_posts_moderation ON posts(moderation_status) WHERE moderation_status != 'approved';
CREATE INDEX idx_posts_direction ON posts(direction);
CREATE INDEX idx_posts_like_count ON posts(like_count DESC);

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- POST IMAGES
-- =============================================

CREATE TABLE post_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  alt_text        TEXT CHECK (char_length(alt_text) <= 200),
  width           INTEGER,
  height          INTEGER,
  size       INTEGER,
  content_type       TEXT,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id, sort_order);

-- =============================================
-- TAGS
-- =============================================

CREATE TABLE tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT UNIQUE NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT CHECK (char_length(description) <= 300),
  usage_count     INTEGER NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX idx_tags_slug ON tags(slug);

-- =============================================
-- POST TAGS
-- =============================================

CREATE TABLE post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- =============================================
-- LIKES
-- =============================================

CREATE TABLE likes (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_likes_post_id ON likes(post_id);

-- Trigger functions for like counter
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  UPDATE profiles SET like_count = like_count + 1
    WHERE id = (SELECT author_id FROM posts WHERE id = NEW.post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET like_count = greatest(like_count - 1, 0) WHERE id = OLD.post_id;
  UPDATE profiles SET like_count = greatest(like_count - 1, 0)
    WHERE id = (SELECT author_id FROM posts WHERE id = OLD.post_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION increment_post_likes();

CREATE TRIGGER after_like_delete
  AFTER DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION decrement_post_likes();

-- Profile post count trigger
CREATE OR REPLACE FUNCTION increment_profile_post_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_profile_post_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET post_count = greatest(post_count - 1, 0) WHERE id = OLD.author_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_post_insert
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION increment_profile_post_count();

CREATE TRIGGER after_post_delete
  AFTER DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION decrement_profile_post_count();

-- =============================================
-- BOOKMARKS
-- =============================================

CREATE TABLE bookmarks (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION increment_post_bookmarks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_bookmarks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET bookmark_count = greatest(bookmark_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_bookmark_insert
  AFTER INSERT ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION increment_post_bookmarks();

CREATE TRIGGER after_bookmark_delete
  AFTER DELETE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION decrement_post_bookmarks();

-- =============================================
-- COMMENTS
-- =============================================

CREATE TABLE comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id         UUID REFERENCES comments(id) ON DELETE CASCADE,
  body              TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  body_html         TEXT NOT NULL,
  depth             SMALLINT NOT NULL DEFAULT 0 CHECK (depth <= 2),
  like_count        INTEGER NOT NULL DEFAULT 0,
  is_edited         BOOLEAN NOT NULL DEFAULT false,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post_id ON comments(post_id, created_at);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = greatest(comment_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION increment_post_comments();

CREATE TRIGGER after_comment_delete
  AFTER DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION decrement_post_comments();

-- =============================================
-- FOLLOWERS
-- =============================================

CREATE TABLE followers (
  follower_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_followers_following ON followers(following_id);
CREATE INDEX idx_followers_follower ON followers(follower_id);

CREATE OR REPLACE FUNCTION increment_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
  UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET follower_count = greatest(follower_count - 1, 0) WHERE id = OLD.following_id;
  UPDATE profiles SET following_count = greatest(following_count - 1, 0) WHERE id = OLD.follower_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_follow_insert
  AFTER INSERT ON followers
  FOR EACH ROW EXECUTE FUNCTION increment_follower_counts();

CREATE TRIGGER after_follow_delete
  AFTER DELETE ON followers
  FOR EACH ROW EXECUTE FUNCTION decrement_follower_counts();

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN (
                    'like', 'comment', 'follow', 'mention', 'bookmark',
                    'repost', 'admin_warning', 'achievement', 'verified',
                    'post_approved', 'post_rejected', 'report_resolved'
                  )),
  notifiable_type TEXT NOT NULL CHECK (notifiable_type IN ('post', 'comment', 'user')),
  notifiable_id   UUID NOT NULL,
  message         TEXT,
  metadata        JSONB,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  is_seen         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE NOT is_read;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);

-- Trigger functions for notification creation
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  IF post_author_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, notifiable_type, notifiable_id)
    VALUES (post_author_id, NEW.user_id, 'like', 'post', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, notifiable_type, notifiable_id)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', 'user', NEW.follower_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  IF post_author_id != NEW.author_id THEN
    INSERT INTO notifications (user_id, actor_id, type, notifiable_type, notifiable_id)
    VALUES (post_author_id, NEW.author_id, 'comment', 'post', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER after_follow_notification
  AFTER INSERT ON followers
  FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

CREATE TRIGGER after_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- =============================================
-- REPORTS
-- =============================================

CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reportable_type TEXT NOT NULL CHECK (reportable_type IN ('post', 'comment', 'profile')),
  reportable_id   UUID NOT NULL,
  reason          TEXT NOT NULL CHECK (reason IN (
                    'spam', 'harassment', 'misinformation', 'impersonation',
                    'hate_speech', 'violent', 'copyright', 'other'
                  )),
  description     TEXT CHECK (char_length(description) <= 2000),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolved_by     UUID REFERENCES profiles(id),
  resolution_note TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_reports_status ON reports(status, created_at);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_target ON reports(reportable_type, reportable_id);

-- =============================================
-- MODERATION ACTIONS
-- =============================================

CREATE TABLE moderation_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id    UUID NOT NULL REFERENCES profiles(id),
  action          TEXT NOT NULL CHECK (action IN (
                    'approve', 'reject', 'flag', 'ban', 'suspend',
                    'warn', 'remove_post', 'remove_comment',
                    'verify', 'unverify', 'dismiss_report'
                  )),
  target_type     TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'profile', 'report')),
  target_id       UUID NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX idx_moderation_actions_created ON moderation_actions(created_at DESC);
CREATE INDEX idx_moderation_actions_target ON moderation_actions(target_type, target_id);

-- =============================================
-- BLOCKED USERS
-- =============================================

CREATE TABLE blocked_users (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blocked_id),
  CHECK (user_id != blocked_id)
);

-- =============================================
-- BADGES
-- =============================================

CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('verification', 'achievement', 'rank')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- =============================================
-- SESSIONS (user-facing session tracking)
-- =============================================

CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_agent  TEXT,
  ip_address  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

-- =============================================
-- RATE LIMITS
-- =============================================

CREATE TABLE rate_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint, created_at);

-- =============================================
-- VERIFICATION REQUESTS
-- =============================================

CREATE TABLE verification_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  notes       TEXT
);

CREATE UNIQUE INDEX idx_verification_requests_user ON verification_requests(user_id) WHERE status = 'pending';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_moderator())
  WITH CHECK (id = auth.uid() OR public.is_moderator());

CREATE POLICY "Only superadmin can delete profiles"
  ON profiles FOR DELETE
  USING (public.is_admin());

-- Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are publicly readable"
  ON posts FOR SELECT
  USING (is_published = true OR author_id = auth.uid() OR public.is_moderator());

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Only authors can update their posts"
  ON posts FOR UPDATE
  USING (author_id = auth.uid() OR public.is_moderator())
  WITH CHECK (author_id = auth.uid() OR public.is_moderator());

CREATE POLICY "Only authors can delete their posts"
  ON posts FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());

-- Post Images
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post images are publicly readable"
  ON post_images FOR SELECT
  USING (true);

CREATE POLICY "Authors can manage post images"
  ON post_images FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
    OR public.is_moderator()
  );

CREATE POLICY "Authors can delete post images"
  ON post_images FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
    OR public.is_admin()
  );

-- Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are publicly readable"
  ON tags FOR SELECT
  USING (true);

-- Post Tags
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post tags are publicly readable"
  ON post_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add tags"
  ON post_tags FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
  );

-- Likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are publicly readable"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike their own"
  ON likes FOR DELETE
  USING (user_id = auth.uid());

-- Bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own bookmarks"
  ON bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can bookmark"
  ON bookmarks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own bookmarks"
  ON bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly readable"
  ON comments FOR SELECT
  USING (moderation_status = 'approved' OR author_id = auth.uid() OR public.is_moderator());

CREATE POLICY "Authenticated users can comment"
  ON comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their comments"
  ON comments FOR UPDATE
  USING (author_id = auth.uid() OR public.is_moderator())
  WITH CHECK (author_id = auth.uid() OR public.is_moderator());

CREATE POLICY "Authors can delete their comments"
  ON comments FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());

-- Followers
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Followers are publicly readable"
  ON followers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can follow"
  ON followers FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
  ON followers FOR DELETE
  USING (follower_id = auth.uid());

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_moderator());

CREATE POLICY "Authenticated users can report"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Moderators can manage reports"
  ON reports FOR UPDATE
  USING (public.is_moderator());

-- Moderation Actions
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can see moderation actions"
  ON moderation_actions FOR SELECT
  USING (public.is_moderator());

CREATE POLICY "Moderators can create moderation actions"
  ON moderation_actions FOR INSERT
  WITH CHECK (moderator_id = auth.uid() AND public.is_moderator());

-- =============================================
-- STORAGE RLS (policies omitted — apply via dashboard after manual bucket creation)
-- =============================================
