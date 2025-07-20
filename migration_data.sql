-- Renty Data Migration SQL
-- Generated on 2025-07-19T23:33:11.715Z
-- Migrates data from mock API to PostgreSQL database

BEGIN;

-- Temporarily disable triggers during migration
SET session_replication_role = replica;

-- Insert landlords
INSERT INTO landlords (id, name, email, phone_number, password_hash, role, profile_picture) VALUES
(1, 'John Doe', 'john.doe@email.com', '+1-555-0123', '$2b$10$hashedpassword1', 'landlord', NULL),
(2, 'Jane Smith', 'jane.smith@email.com', '+1-555-0124', '$2b$10$hashedpassword2', 'landlord', NULL),
(3, 'Mike Johnson', 'mike.johnson@email.com', '+1-555-0125', '$2b$10$hashedpassword3', 'landlord', NULL);

-- Insert tenants
INSERT INTO tenants (id, name, email, phone_number, role, profile_picture, average_rating, total_reviews) VALUES
(1, 'Alice Wilson', 'alice.wilson@email.com', '+1-555-0101', 'tenant', NULL, 4.5, 2),
(2, 'Bob Thompson', 'bob.thompson@email.com', '+1-555-0102', 'tenant', NULL, 4.2, 3),
(3, 'Carol Davis', 'carol.davis@email.com', '+1-555-0103', 'tenant', NULL, 4.4, 1),
(4, 'David Brown', 'david.brown@email.com', '+1-555-0126', 'tenant', NULL, 0, 0);

-- Insert reviews
INSERT INTO reviews (id, tenant_id, reviewer_id, rating, comment, property_address, rental_period, reviewer_name, reviewer_role, date_created) VALUES
(1, 1, 1, 5, 'Excellent tenant! Always paid rent on time and kept the property in great condition.', '123 Main St, Apt 4B', 'Jan 2023 - Dec 2023', 'John Doe', 'landlord', '2023-12-15'),
(2, 1, 2, 4, 'Good tenant overall. Had minor communication issues but resolved them quickly.', '456 Oak Ave, Unit 2', 'Jun 2022 - May 2023', 'Jane Smith', 'landlord', '2023-05-20'),
(3, 2, 1, 4, 'Reliable tenant with good property care habits.', '789 Pine St, Apt 1A', 'Mar 2022 - Feb 2023', 'John Doe', 'landlord', '2023-02-28'),
(4, 2, 3, 4, 'Professional and respectful tenant. Would rent to again.', '321 Elm St', 'Sep 2021 - Aug 2022', 'Mike Johnson', 'landlord', '2022-08-30'),
(5, 2, 2, 5, 'Outstanding tenant! No issues whatsoever during the entire lease period.', '654 Maple Dr, Unit 3', 'Jan 2021 - Dec 2021', 'Jane Smith', 'landlord', '2021-12-31'),
(6, 3, 1, 4, 'Good tenant with timely rent payments and proper communication.', '987 Cedar Ln', 'Apr 2023 - Mar 2024', 'John Doe', 'landlord', '2024-03-15');

-- Insert detailed ratings
INSERT INTO ratings (review_id, category, rating) VALUES
(1, 'rent_payments', 5),
(1, 'lease_completion', 5),
(1, 'communication', 5),
(1, 'property_care', 5),
(1, 'legal_disputes', 5),
(2, 'rent_payments', 5),
(2, 'lease_completion', 4),
(2, 'communication', 3),
(2, 'property_care', 4),
(2, 'legal_disputes', 4),
(3, 'rent_payments', 4),
(3, 'lease_completion', 4),
(3, 'communication', 4),
(3, 'property_care', 5),
(3, 'legal_disputes', 3),
(4, 'rent_payments', 4),
(4, 'lease_completion', 4),
(4, 'communication', 5),
(4, 'property_care', 4),
(4, 'legal_disputes', 4),
(5, 'rent_payments', 5),
(5, 'lease_completion', 4),
(5, 'communication', 5),
(5, 'property_care', 4),
(5, 'legal_disputes', 4),
(6, 'rent_payments', 5),
(6, 'lease_completion', 4),
(6, 'communication', 5),
(6, 'property_care', 4),
(6, 'legal_disputes', 4);

-- Insert proof files
INSERT INTO proof_files (review_id, name, type, size, url, uploaded_date) VALUES
(1, 'property_before.jpg', 'image/jpeg', 2048000, 'mock_proof_1640995200_abc123def.jpg', '2023-12-15T10:30:00Z'),
(1, 'rent_receipts.pdf', 'application/pdf', 1024000, 'mock_proof_1640995201_def456ghi.pdf', '2023-12-15T10:31:00Z'),
(2, 'lease_signed.pdf', 'application/pdf', 1536000, 'mock_proof_1684704000_ghi789jkl.pdf', '2023-05-20T14:20:00Z'),
(3, 'property_condition.jpg', 'image/jpeg', 1792000, 'mock_proof_1677628800_jkl012mno.jpg', '2023-02-28T16:45:00Z'),
(6, 'final_inspection.jpg', 'image/jpeg', 2304000, 'mock_proof_1710460800_mno345pqr.jpg', '2024-03-15T12:00:00Z'),
(6, 'damage_report.pdf', 'application/pdf', 896000, 'mock_proof_1710460801_pqr678stu.pdf', '2024-03-15T12:01:00Z');

-- Reset sequences to continue from max IDs
SELECT setval('landlords_id_seq', (SELECT MAX(id) FROM landlords));
SELECT setval('tenants_id_seq', (SELECT MAX(id) FROM tenants));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
SELECT setval('ratings_id_seq', (SELECT MAX(id) FROM ratings));
SELECT setval('proof_files_id_seq', (SELECT MAX(id) FROM proof_files));

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
