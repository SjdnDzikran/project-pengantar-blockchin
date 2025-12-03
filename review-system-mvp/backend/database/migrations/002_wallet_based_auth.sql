-- Migration to wallet-based authentication
-- This removes email/password and uses wallet addresses instead

-- Add wallet_address column to users table
ALTER TABLE users ADD COLUMN wallet_address VARCHAR(42) UNIQUE;

-- Create index on wallet_address
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Add nonce for signature verification
ALTER TABLE users ADD COLUMN nonce VARCHAR(255);

-- Update employment_verifications to work with wallet addresses
-- The user_id foreign key will remain but users will be identified by wallet_address

-- For new installations, we'll create a simpler structure
-- But for migration, we'll keep existing structure and add wallet support

-- Optional: Add wallet_address directly to employment_verifications for faster lookups
ALTER TABLE employment_verifications ADD COLUMN wallet_address VARCHAR(42);
CREATE INDEX idx_verifications_wallet ON employment_verifications(wallet_address);

-- Optional: Add wallet_address to review_metadata for faster lookups  
ALTER TABLE review_metadata ADD COLUMN wallet_address VARCHAR(42);
CREATE INDEX idx_reviews_wallet ON review_metadata(wallet_address);

-- Update existing data (if any) - this would need to be done manually
-- For now, new users will be created with wallet addresses

COMMENT ON COLUMN users.wallet_address IS 'Ethereum wallet address (0x...) used for authentication';
COMMENT ON COLUMN users.nonce IS 'Random nonce for signature verification, regenerated after each login';
