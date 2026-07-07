CREATE TABLE verification_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'email_verification',
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_codes_user ON verification_codes(user_id, type);
CREATE INDEX idx_verification_codes_lookup ON verification_codes(user_id, type, code) WHERE used_at IS NULL;
