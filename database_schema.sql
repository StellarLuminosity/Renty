-- Renty Database Schema
-- Complete schema for transitioning from mock data to PostgreSQL database
-- Author: Database Schema Analysis
-- Date: $(date)

-- ========================================
-- TABLES CREATION
-- ========================================

-- Landlords table (Users who can login and leave reviews)
CREATE TABLE landlords (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'landlord',
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenants table (Profiles that receive reviews from landlords)
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    role VARCHAR(20) DEFAULT 'tenant',
    profile_picture TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table (Landlord reviews about tenants)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES landlords(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    property_address VARCHAR(500),
    rental_period VARCHAR(200),
    reviewer_name VARCHAR(255),
    reviewer_role VARCHAR(20) DEFAULT 'landlord',
    date_created DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detailed ratings per review (5 categories for landlord-to-tenant evaluation)
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'rent_payments', 
        'lease_completion', 
        'communication', 
        'property_care', 
        'legal_disputes'
    )),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proof files for reviews (images, videos, PDFs supporting review claims)
CREATE TABLE proof_files (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    url TEXT NOT NULL,
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lease agreements for reviews (contract documents)
CREATE TABLE lease_agreements (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    url TEXT NOT NULL,
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Search indexes
CREATE INDEX idx_landlords_email ON landlords(email);
CREATE INDEX idx_tenants_name ON tenants(name);
CREATE INDEX idx_tenants_email ON tenants(email);

-- Foreign key indexes
CREATE INDEX idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_ratings_review_id ON ratings(review_id);
CREATE INDEX idx_proof_files_review_id ON proof_files(review_id);
CREATE INDEX idx_lease_agreements_review_id ON lease_agreements(review_id);

-- Query optimization indexes
CREATE INDEX idx_reviews_date_created ON reviews(date_created DESC);
CREATE INDEX idx_tenants_average_rating ON tenants(average_rating DESC);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update average rating for tenants
CREATE OR REPLACE FUNCTION update_tenant_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update average rating and total reviews for the tenant
    UPDATE tenants 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0.00)
            FROM reviews 
            WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.tenant_id, OLD.tenant_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update tenant ratings
CREATE TRIGGER trigger_update_tenant_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_average_rating();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at timestamps
CREATE TRIGGER update_landlords_modtime 
    BEFORE UPDATE ON landlords 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenants_modtime 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reviews_modtime 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_column();

-- ========================================
-- SAMPLE DATA MIGRATION FROM MOCK DATA
-- ========================================

-- Insert sample landlords (from mockUsers)
INSERT INTO landlords (id, name, email, phone_number, password_hash, role) VALUES
(1, 'John Doe', 'john.doe@email.com', '+1-555-0123', '$2b$10$hashedpassword1', 'landlord'),
(2, 'Jane Smith', 'jane.smith@email.com', '+1-555-0124', '$2b$10$hashedpassword2', 'landlord'),
(3, 'Mike Johnson', 'mike.johnson@email.com', '+1-555-0125', '$2b$10$hashedpassword3', 'landlord');

-- Insert sample tenants (from mockTenants)
INSERT INTO tenants (id, name, phone_number, email, role, average_rating, total_reviews) VALUES
(1, 'Alice Wilson', '+1-555-0101', 'alice.wilson@email.com', 'tenant', 4.5, 2),
(2, 'Bob Thompson', '+1-555-0102', 'bob.thompson@email.com', 'tenant', 4.2, 3),
(3, 'Carol Davis', '+1-555-0103', 'carol.davis@email.com', 'tenant', 4.4, 1),
(4, 'David Brown', '+1-555-0126', 'david.brown@email.com', 'tenant', 0, 0);

-- Sample reviews (from mockTenants reviews_received)
INSERT INTO reviews (tenant_id, reviewer_id, rating, comment, property_address, rental_period, reviewer_name, reviewer_role, date_created) VALUES
(1, 1, 5, 'Excellent tenant! Always paid rent on time and kept the property in great condition.', '123 Main St, Apt 4B', 'Jan 2023 - Dec 2023', 'John Doe', 'landlord', '2023-12-15'),
(1, 2, 4, 'Good tenant overall. Had minor communication issues but resolved them quickly.', '456 Oak Ave, Unit 2', 'Jun 2022 - May 2023', 'Jane Smith', 'landlord', '2023-05-20'),
(2, 1, 4, 'Reliable tenant with good property care habits.', '789 Pine St, Apt 1A', 'Mar 2022 - Feb 2023', 'John Doe', 'landlord', '2023-02-28'),
(2, 3, 4, 'Professional and respectful tenant. Would rent to again.', '321 Elm St', 'Sep 2021 - Aug 2022', 'Mike Johnson', 'landlord', '2022-08-30'),
(2, 2, 5, 'Outstanding tenant! No issues whatsoever during the entire lease period.', '654 Maple Dr, Unit 3', 'Jan 2021 - Dec 2021', 'Jane Smith', 'landlord', '2021-12-31'),
(3, 1, 4, 'Good tenant with timely rent payments and proper communication.', '987 Cedar Ln', 'Apr 2023 - Mar 2024', 'John Doe', 'landlord', '2024-03-15');

-- Sample detailed ratings for reviews
INSERT INTO ratings (review_id, category, rating) VALUES
-- Review 1 ratings
(1, 'rent_payments', 5),
(1, 'lease_completion', 5),
(1, 'communication', 5),
(1, 'property_care', 5),
(1, 'legal_disputes', 5),
-- Review 2 ratings
(2, 'rent_payments', 5),
(2, 'lease_completion', 4),
(2, 'communication', 3),
(2, 'property_care', 4),
(2, 'legal_disputes', 4),
-- Review 3 ratings
(3, 'rent_payments', 4),
(3, 'lease_completion', 4),
(3, 'communication', 4),
(3, 'property_care', 5),
(3, 'legal_disputes', 3),
-- Review 4 ratings
(4, 'rent_payments', 4),
(4, 'lease_completion', 4),
(4, 'communication', 5),
(4, 'property_care', 4),
(4, 'legal_disputes', 4),
-- Review 5 ratings
(5, 'rent_payments', 5),
(5, 'lease_completion', 4),
(5, 'communication', 5),
(5, 'property_care', 4),
(5, 'legal_disputes', 4),
-- Review 6 ratings
(6, 'rent_payments', 5),
(6, 'lease_completion', 4),
(6, 'communication', 5),
(6, 'property_care', 4),
(6, 'legal_disputes', 4);

-- Sample proof files (with mock URLs from current implementation)
INSERT INTO proof_files (review_id, name, type, size, url, uploaded_date) VALUES
(1, 'property_before.jpg', 'image/jpeg', 2048000, 'mock_proof_1640995200_abc123def.jpg', '2023-12-15'),
(1, 'rent_receipts.pdf', 'application/pdf', 1024000, 'mock_proof_1640995201_def456ghi.pdf', '2023-12-15'),
(2, 'lease_signed.pdf', 'application/pdf', 1536000, 'mock_proof_1684704000_ghi789jkl.pdf', '2023-05-20'),
(3, 'property_condition.jpg', 'image/jpeg', 1792000, 'mock_proof_1677628800_jkl012mno.jpg', '2023-02-28'),
(6, 'final_inspection.jpg', 'image/jpeg', 2304000, 'mock_proof_1710460800_mno345pqr.jpg', '2024-03-15'),
(6, 'damage_report.pdf', 'application/pdf', 896000, 'mock_proof_1710460801_pqr678stu.pdf', '2024-03-15');

-- Reset sequences to continue from max IDs
SELECT setval('landlords_id_seq', (SELECT MAX(id) FROM landlords));
SELECT setval('tenants_id_seq', (SELECT MAX(id) FROM tenants));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
SELECT setval('ratings_id_seq', (SELECT MAX(id) FROM ratings));
SELECT setval('proof_files_id_seq', (SELECT MAX(id) FROM proof_files));

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for tenant profiles with calculated statistics
CREATE VIEW tenant_profiles AS
SELECT 
    t.*,
    COALESCE(review_stats.review_count, 0) as review_count,
    COALESCE(review_stats.avg_rating, 0.00) as calculated_avg_rating,
    COALESCE(review_stats.latest_review_date, t.created_at) as latest_review_date
FROM tenants t
LEFT JOIN (
    SELECT 
        tenant_id,
        COUNT(*) as review_count,
        AVG(rating) as avg_rating,
        MAX(date_created) as latest_review_date
    FROM reviews 
    GROUP BY tenant_id
) review_stats ON t.id = review_stats.tenant_id;

-- View for reviews with all related data
CREATE VIEW review_details AS
SELECT 
    r.*,
    t.name as tenant_name,
    l.name as landlord_name,
    l.email as landlord_email,
    -- Aggregate ratings into JSON
    (
        SELECT json_object_agg(rt.category, rt.rating)
        FROM ratings rt 
        WHERE rt.review_id = r.id
    ) as ratings_detail,
    -- Count of proof files
    (
        SELECT COUNT(*) 
        FROM proof_files pf 
        WHERE pf.review_id = r.id
    ) as proof_files_count,
    -- Has lease agreement
    (
        SELECT COUNT(*) > 0
        FROM lease_agreements la 
        WHERE la.review_id = r.id
    ) as has_lease_agreement
FROM reviews r
JOIN tenants t ON r.tenant_id = t.id
JOIN landlords l ON r.reviewer_id = l.id;

-- ========================================
-- CLEANUP AND MAINTENANCE
-- ========================================

-- Function to clean up orphaned files (files not linked to reviews)
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up orphaned proof files
    DELETE FROM proof_files 
    WHERE review_id NOT IN (SELECT id FROM reviews);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up orphaned lease agreements
    DELETE FROM lease_agreements 
    WHERE review_id NOT IN (SELECT id FROM reviews);
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SECURITY AND PERMISSIONS
-- ========================================

-- Create application user with limited permissions
-- CREATE USER renty_app WITH PASSWORD 'secure_app_password';
-- GRANT CONNECT ON DATABASE renty_db TO renty_app;
-- GRANT USAGE ON SCHEMA public TO renty_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO renty_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO renty_app;

-- ========================================
-- NOTES FOR BACKEND INTEGRATION
-- ========================================

/*
API Endpoint Mappings:

1. Authentication:
   - POST /api/auth/login → Query landlords table with email/password
   - POST /api/auth/signup → Insert into landlords table

2. Tenants:
   - GET /api/tenants/search?name=:name → Query tenants with ILIKE %name%
   - GET /api/tenants/:id → Query tenant_profiles view
   - POST /api/tenants → Insert into tenants table

3. Reviews:
   - POST /api/reviews → Insert into reviews, ratings, proof_files, lease_agreements tables
   - FormData handling for file uploads to cloud storage

Key Implementation Notes:
- Password hashing with bcrypt before storing password_hash
- JWT tokens for authentication
- File uploads to cloud storage (Supabase Storage, AWS S3, etc.)
- Proper error handling and validation
- Rate limiting for API endpoints
- Database connection pooling for performance
*/
