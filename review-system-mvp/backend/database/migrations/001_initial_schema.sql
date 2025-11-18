-- CompanyReview System Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_hash VARCHAR(66) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_hash ON users(email_hash);

-- Companies Table
CREATE TABLE companies (
    company_id VARCHAR(66) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(100),
    location VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(company_name);
CREATE INDEX idx_companies_industry ON companies(industry);

-- Employment Verifications Table
CREATE TABLE employment_verifications (
    verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    company_id VARCHAR(66) REFERENCES companies(company_id) ON DELETE CASCADE,
    employee_id_hash VARCHAR(66) NOT NULL,
    verification_document_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_verifications_user ON employment_verifications(user_id);
CREATE INDEX idx_verifications_company ON employment_verifications(company_id);
CREATE INDEX idx_verifications_status ON employment_verifications(status);

-- Review Metadata Table (Index to blockchain)
CREATE TABLE review_metadata (
    review_id VARCHAR(20) PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    company_id VARCHAR(66) REFERENCES companies(company_id) ON DELETE CASCADE,
    blockchain_tx_hash VARCHAR(66),
    block_number BIGINT,
    review_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    is_published BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_review_metadata_user ON review_metadata(user_id);
CREATE INDEX idx_review_metadata_company ON review_metadata(company_id);
CREATE INDEX idx_review_metadata_tx ON review_metadata(blockchain_tx_hash);

-- Review Cache Table (for faster queries without blockchain reads)
CREATE TABLE review_cache (
    review_id VARCHAR(20) PRIMARY KEY REFERENCES review_metadata(review_id) ON DELETE CASCADE,
    company_id VARCHAR(66) REFERENCES companies(company_id),
    company_name VARCHAR(255),
    rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    review_text TEXT,
    reviewer_hash VARCHAR(66),
    employment_proof_hash VARCHAR(66),
    timestamp BIGINT NOT NULL,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_cache_company ON review_cache(company_id);
CREATE INDEX idx_review_cache_rating ON review_cache(rating);
CREATE INDEX idx_review_cache_timestamp ON review_cache(timestamp);

-- Company Statistics View (Aggregated)
CREATE VIEW company_statistics AS
SELECT
    c.company_id,
    c.company_name,
    c.industry,
    c.location,
    COUNT(rc.review_id) as total_reviews,
    ROUND(AVG(rc.rating)::numeric, 2) as average_rating,
    COUNT(DISTINCT CASE WHEN rc.rating = 5 THEN rc.review_id END) as five_star_count,
    COUNT(DISTINCT CASE WHEN rc.rating = 4 THEN rc.review_id END) as four_star_count,
    COUNT(DISTINCT CASE WHEN rc.rating = 3 THEN rc.review_id END) as three_star_count,
    COUNT(DISTINCT CASE WHEN rc.rating = 2 THEN rc.review_id END) as two_star_count,
    COUNT(DISTINCT CASE WHEN rc.rating = 1 THEN rc.review_id END) as one_star_count,
    MAX(rc.timestamp) as last_review_timestamp
FROM companies c
LEFT JOIN review_cache rc ON c.company_id = rc.company_id
GROUP BY c.company_id, c.company_name, c.industry, c.location;

-- User Review Count View
CREATE VIEW user_review_counts AS
SELECT
    u.user_id,
    u.email,
    u.full_name,
    COUNT(rm.review_id) as total_reviews,
    COUNT(DISTINCT rm.company_id) as companies_reviewed,
    MAX(rm.created_at) as last_review_date
FROM users u
LEFT JOIN review_metadata rm ON u.user_id = rm.user_id
GROUP BY u.user_id, u.email, u.full_name;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON employment_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial companies
INSERT INTO companies (company_id, company_name, industry, location, website, description) VALUES
('0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3', 'PT Teknologi Maju Indonesia', 'Technology', 'Jakarta', 'https://tekno-maju.co.id', 'Leading technology company in Indonesia'),
('0x2deb85ba02a2fe7e930446d2d5b196e3f39f4bf3f3af4a6c4fb8032bf19fc3d4', 'PT Digital Solusi Nusantara', 'IT Services', 'Bandung', 'https://digitalsolusi.id', 'Digital transformation solutions provider'),
('0x3fec96cb13b3gf8f041557e3e6c207f4g40g5cg4g4bg5b7d5gc9143cg20gd4e5', 'PT Inovasi Teknologi Pratama', 'Software Development', 'Surabaya', 'https://inovasi-tech.com', 'Innovative software development company'),
('0x40fd07dc24c4hg9g152668f4f7d318g5h51h6dh5h5ch6c8e6hd0254dh31he5f6', 'PT Cyber Solutions Indonesia', 'Cybersecurity', 'Jakarta', 'https://cybersolutions.co.id', 'Cybersecurity and IT infrastructure'),
('0x51ge18ed35d5ih0h263779g5g8e429h6i62i7ei6i6di7d9f7ie1365ei42if6g7', 'PT Global Tech Indonesia', 'Technology', 'Tangerang', 'https://globaltech.id', 'Global technology solutions and consulting');

-- Create admin user (password: admin123)
INSERT INTO users (email, email_hash, password_hash, full_name, is_verified) VALUES
('admin@reviewsystem.com', '0xadminHash123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzNXmA', 'System Administrator', true);
