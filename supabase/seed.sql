-- Seed data for development

-- Create badges
INSERT INTO badges (name, slug, description, icon, type) VALUES
  ('Verified Analyst', 'verified-analyst', 'Professional Elliott Wave analyst', 'badge-check', 'verification'),
  ('Rising Star', 'rising-star', 'Fastest growing reputation', 'trending-up', 'achievement'),
  ('Top Contributor', 'top-contributor', 'Consistent high-quality analysis', 'award', 'achievement'),
  ('100 Posts', '100-posts', 'Published 100 analysis posts', 'file-text', 'achievement'),
  ('10K Followers', '10k-followers', 'Reached 10,000 followers', 'users', 'achievement')
ON CONFLICT (name) DO NOTHING;

-- Create some initial tags
INSERT INTO tags (name, slug, description) VALUES
  ('Bitcoin', 'bitcoin', 'Bitcoin (BTC) Elliott Wave analysis'),
  ('Ethereum', 'ethereum', 'Ethereum (ETH) Elliott Wave analysis'),
  ('S&P 500', 'sp-500', 'S&P 500 Index Elliott Wave analysis'),
  ('Gold', 'gold', 'Gold (XAU/USD) Elliott Wave analysis'),
  ('Forex', 'forex', 'Forex market Elliott Wave analysis'),
  ('Stocks', 'stocks', 'Stock market Elliott Wave analysis'),
  ('Crypto', 'crypto', 'Cryptocurrency market Elliott Wave analysis'),
  ('Commodities', 'commodities', 'Commodity market Elliott Wave analysis'),
  ('Wave Count', 'wave-count', 'Specific Elliott Wave count analysis'),
  ('Educational', 'educational', 'Educational content about Elliott Wave theory')
ON CONFLICT (name) DO NOTHING;
