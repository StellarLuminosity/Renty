/**
 * Data Migration Script for Renty
 * Extracts mock data from api.js and formats it for database insertion
 * Run this script to generate SQL INSERT statements from current mock data
 */

const fs = require('fs');
const path = require('path');

// Import mock data from api.js (you'll need to adjust the path)
// For now, we'll define the data structure based on the analysis

const mockUsers = {
  1: {
    id: 1,
    name: 'John Doe',
    phone_number: '+1-555-0123',
    email: 'john.doe@email.com',
    role: 'landlord',
    profile_picture: null,
    reviews_received: [],
    reviews_submitted: []
  },
  2: {
    id: 2,
    name: 'Jane Smith', 
    phone_number: '+1-555-0124',
    email: 'jane.smith@email.com',
    role: 'landlord',
    profile_picture: null,
    reviews_received: [],
    reviews_submitted: []
  },
  3: {
    id: 3,
    name: 'Mike Johnson',
    phone_number: '+1-555-0125', 
    email: 'mike.johnson@email.com',
    role: 'landlord',
    profile_picture: null,
    reviews_received: [],
    reviews_submitted: []
  }
};

const mockTenants = {
  1: {
    id: 1,
    name: 'Alice Wilson',
    phone_number: '+1-555-0101',
    email: 'alice.wilson@email.com',
    role: 'tenant',
    profile_picture: null,
    average_rating: 4.5,
    reviews_received: [
      {
        id: 1001,
        reviewer_name: 'John Doe',
        reviewer_role: 'landlord',
        rating: 5,
        comment: 'Excellent tenant! Always paid rent on time and kept the property in great condition.',
        property_address: '123 Main St, Apt 4B',
        rental_period: 'Jan 2023 - Dec 2023',
        date_created: '2023-12-15',
        ratings: {
          rent_payments: 5,
          lease_completion: 5,
          communication: 5,
          property_care: 5,
          legal_disputes: 5
        },
        proof_files: [
          {
            name: 'property_before.jpg',
            type: 'image/jpeg',
            size: 2048000,
            url: 'mock_proof_1640995200_abc123def.jpg',
            uploaded_date: '2023-12-15T10:30:00Z'
          },
          {
            name: 'rent_receipts.pdf',
            type: 'application/pdf', 
            size: 1024000,
            url: 'mock_proof_1640995201_def456ghi.pdf',
            uploaded_date: '2023-12-15T10:31:00Z'
          }
        ]
      },
      {
        id: 1002,
        reviewer_name: 'Jane Smith',
        reviewer_role: 'landlord',
        rating: 4,
        comment: 'Good tenant overall. Had minor communication issues but resolved them quickly.',
        property_address: '456 Oak Ave, Unit 2',
        rental_period: 'Jun 2022 - May 2023',
        date_created: '2023-05-20',
        ratings: {
          rent_payments: 5,
          lease_completion: 4,
          communication: 3,
          property_care: 4,
          legal_disputes: 4
        },
        proof_files: [
          {
            name: 'lease_signed.pdf',
            type: 'application/pdf',
            size: 1536000,
            url: 'mock_proof_1684704000_ghi789jkl.pdf',
            uploaded_date: '2023-05-20T14:20:00Z'
          }
        ]
      }
    ],
    reviews_submitted: []
  },
  2: {
    id: 2,
    name: 'Bob Thompson',
    phone_number: '+1-555-0102',
    email: 'bob.thompson@email.com',
    role: 'tenant',
    profile_picture: null,
    average_rating: 4.2,
    reviews_received: [
      {
        id: 1003,
        reviewer_name: 'John Doe',
        reviewer_role: 'landlord',
        rating: 4,
        comment: 'Reliable tenant with good property care habits.',
        property_address: '789 Pine St, Apt 1A',
        rental_period: 'Mar 2022 - Feb 2023',
        date_created: '2023-02-28',
        ratings: {
          rent_payments: 4,
          lease_completion: 4,
          communication: 4,
          property_care: 5,
          legal_disputes: 3
        },
        proof_files: [
          {
            name: 'property_condition.jpg',
            type: 'image/jpeg',
            size: 1792000,
            url: 'mock_proof_1677628800_jkl012mno.jpg',
            uploaded_date: '2023-02-28T16:45:00Z'
          }
        ]
      },
      {
        id: 1004,
        reviewer_name: 'Mike Johnson',
        reviewer_role: 'landlord',
        rating: 4,
        comment: 'Professional and respectful tenant. Would rent to again.',
        property_address: '321 Elm St',
        rental_period: 'Sep 2021 - Aug 2022',
        date_created: '2022-08-30',
        ratings: {
          rent_payments: 4,
          lease_completion: 4,
          communication: 5,
          property_care: 4,
          legal_disputes: 4
        },
        proof_files: []
      },
      {
        id: 1005,
        reviewer_name: 'Jane Smith',
        reviewer_role: 'landlord',
        rating: 5,
        comment: 'Outstanding tenant! No issues whatsoever during the entire lease period.',
        property_address: '654 Maple Dr, Unit 3',
        rental_period: 'Jan 2021 - Dec 2021',
        date_created: '2021-12-31',
        ratings: {
          rent_payments: 5,
          lease_completion: 4,
          communication: 5,
          property_care: 4,
          legal_disputes: 4
        },
        proof_files: []
      }
    ],
    reviews_submitted: []
  },
  3: {
    id: 3,
    name: 'Carol Davis',
    phone_number: '+1-555-0103',
    email: 'carol.davis@email.com',
    role: 'tenant',
    profile_picture: null,
    average_rating: 4.4,
    reviews_received: [
      {
        id: 1006,
        reviewer_name: 'John Doe',
        reviewer_role: 'landlord',
        rating: 4,
        comment: 'Good tenant with timely rent payments and proper communication.',
        property_address: '987 Cedar Ln',
        rental_period: 'Apr 2023 - Mar 2024',
        date_created: '2024-03-15',
        ratings: {
          rent_payments: 5,
          lease_completion: 4,
          communication: 5,
          property_care: 4,
          legal_disputes: 4
        },
        proof_files: [
          {
            name: 'final_inspection.jpg',
            type: 'image/jpeg',
            size: 2304000,
            url: 'mock_proof_1710460800_mno345pqr.jpg',
            uploaded_date: '2024-03-15T12:00:00Z'
          },
          {
            name: 'damage_report.pdf',
            type: 'application/pdf',
            size: 896000,
            url: 'mock_proof_1710460801_pqr678stu.pdf',
            uploaded_date: '2024-03-15T12:01:00Z'
          }
        ]
      }
    ],
    reviews_submitted: []
  },
  4: {
    id: 4,
    name: 'David Brown',
    phone_number: '+1-555-0126',
    email: 'david.brown@email.com',
    role: 'tenant',
    profile_picture: null,
    average_rating: 0,
    reviews_received: [],
    reviews_submitted: []
  }
};

/**
 * Generate SQL INSERT statements for landlords
 */
function generateLandlordInserts() {
  const landlords = Object.values(mockUsers).filter(user => user.role === 'landlord');
  
  let sql = "-- Insert landlords\nINSERT INTO landlords (id, name, email, phone_number, password_hash, role, profile_picture) VALUES\n";
  
  const values = landlords.map(landlord => {
    const profilePicture = landlord.profile_picture ? `'${landlord.profile_picture}'` : 'NULL';
    return `(${landlord.id}, '${landlord.name}', '${landlord.email}', '${landlord.phone_number}', '$2b$10$hashedpassword${landlord.id}', '${landlord.role}', ${profilePicture})`;
  });
  
  sql += values.join(',\n') + ';\n\n';
  return sql;
}

/**
 * Generate SQL INSERT statements for tenants
 */
function generateTenantInserts() {
  const tenants = Object.values(mockTenants);
  
  // Add new columns for the extra attributes
  let sql = "-- Insert tenants\nINSERT INTO tenants (id, name, email, phone_number, role, profile_picture, average_rating, total_reviews, creditScoreLabel, bankruptcyReport) VALUES\n";
  const creditLabels = ['Good', 'Mediocre', 'Bad'];
  let creditIndex = 0;
  let bankruptcyToggle = false;
  
  const values = tenants.map((tenant, i) => {
    const email = tenant.email ? `'${tenant.email}'` : 'NULL';
    const phone = tenant.phone_number ? `'${tenant.phone_number}'` : 'NULL';
    const profilePicture = tenant.profile_picture ? `'${tenant.profile_picture}'` : 'NULL';
    const totalReviews = tenant.reviews_received ? tenant.reviews_received.length : 0;
    // Cycle through all possible combinations
    const creditScoreLabel = `'${creditLabels[creditIndex % creditLabels.length]}'`;
    const bankruptcyReport = bankruptcyToggle ? 'TRUE' : 'FALSE';
    creditIndex++;
    bankruptcyToggle = !bankruptcyToggle;
    return `(${tenant.id}, '${tenant.name}', ${email}, ${phone}, '${tenant.role}', ${profilePicture}, ${tenant.average_rating}, ${totalReviews}, ${creditScoreLabel}, ${bankruptcyReport})`;
  });
  
  sql += values.join(',\n') + ';\n\n';
  return sql;
}

/**
 * Generate SQL INSERT statements for reviews
 */
function generateReviewInserts() {
  let sql = "-- Insert reviews\nINSERT INTO reviews (id, tenant_id, reviewer_id, rating, comment, property_address, rental_period, reviewer_name, reviewer_role, date_created) VALUES\n";
  
  const reviewValues = [];
  let reviewId = 1;
  
  // Map reviewer names to IDs
  const reviewerNameToId = {
    'John Doe': 1,
    'Jane Smith': 2,
    'Mike Johnson': 3
  };
  
  Object.values(mockTenants).forEach(tenant => {
    if (tenant.reviews_received) {
      tenant.reviews_received.forEach(review => {
        const reviewerId = reviewerNameToId[review.reviewer_name] || 1;
        const comment = review.comment.replace(/'/g, "''"); // Escape single quotes
        
        reviewValues.push(
          `(${reviewId}, ${tenant.id}, ${reviewerId}, ${review.rating}, '${comment}', '${review.property_address}', '${review.rental_period}', '${review.reviewer_name}', '${review.reviewer_role}', '${review.date_created}')`
        );
        
        // Store the mapping for ratings and files
        review._migrationId = reviewId;
        reviewId++;
      });
    }
  });
  
  sql += reviewValues.join(',\n') + ';\n\n';
  return sql;
}

/**
 * Generate SQL INSERT statements for detailed ratings
 */
function generateRatingInserts() {
  let sql = "-- Insert detailed ratings\nINSERT INTO ratings (review_id, category, rating) VALUES\n";
  
  const ratingValues = [];
  
  Object.values(mockTenants).forEach(tenant => {
    if (tenant.reviews_received) {
      tenant.reviews_received.forEach(review => {
        if (review.ratings && review._migrationId) {
          Object.entries(review.ratings).forEach(([category, rating]) => {
            ratingValues.push(`(${review._migrationId}, '${category}', ${rating})`);
          });
        }
      });
    }
  });
  
  sql += ratingValues.join(',\n') + ';\n\n';
  return sql;
}

/**
 * Generate SQL INSERT statements for proof files
 */
function generateProofFileInserts() {
  let sql = "-- Insert proof files\nINSERT INTO proof_files (review_id, name, type, size, url, uploaded_date) VALUES\n";
  
  const fileValues = [];
  
  Object.values(mockTenants).forEach(tenant => {
    if (tenant.reviews_received) {
      tenant.reviews_received.forEach(review => {
        if (review.proof_files && review.proof_files.length > 0 && review._migrationId) {
          review.proof_files.forEach(file => {
            const uploadedDate = file.uploaded_date || new Date().toISOString();
            fileValues.push(
              `(${review._migrationId}, '${file.name}', '${file.type}', ${file.size}, '${file.url}', '${uploadedDate}')`
            );
          });
        }
      });
    }
  });
  
  if (fileValues.length > 0) {
    sql += fileValues.join(',\n') + ';\n\n';
  } else {
    sql = "-- No proof files to insert\n\n";
  }
  
  return sql;
}

/**
 * Generate complete migration SQL
 */
function generateMigrationSQL() {
  let sql = `-- Renty Data Migration SQL
-- Generated on ${new Date().toISOString()}
-- Migrates data from mock API to PostgreSQL database

BEGIN;

-- Temporarily disable triggers during migration
SET session_replication_role = replica;

`;

  sql += generateLandlordInserts();
  sql += generateTenantInserts();
  sql += generateReviewInserts();
  sql += generateRatingInserts();
  sql += generateProofFileInserts();
  
  sql += `-- Reset sequences to continue from max IDs
SELECT setval('landlords_id_seq', (SELECT MAX(id) FROM landlords));
SELECT setval('tenants_id_seq', (SELECT MAX(id) FROM tenants));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
SELECT setval('ratings_id_seq', (SELECT MAX(id) FROM ratings));
SELECT setval('proof_files_id_seq', (SELECT MAX(id) FROM proof_files));

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
`;

  return sql;
}

/**
 * Generate environment configuration template
 */
function generateEnvTemplate() {
  return `# Renty Backend Environment Configuration
# Copy to .env and update with your actual values

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/renty_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=renty_db
DB_USER=renty_app
DB_PASSWORD=secure_app_password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRATION=24h

# File Upload Configuration
# Option 1: Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Option 2: AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=renty-uploads
AWS_REGION=us-east-1

# Option 3: Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application Configuration
NODE_ENV=development
PORT=8000
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (if needed for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
`;
}

/**
 * Main migration function
 */
function runMigration() {
  try {
    // Generate migration SQL
    const migrationSQL = generateMigrationSQL();
    fs.writeFileSync('./migration_data.sql', migrationSQL);
    console.log('✅ Migration SQL generated: migration_data.sql');
    
    // Generate environment template
    const envTemplate = generateEnvTemplate();
    fs.writeFileSync('./env.template', envTemplate);
    console.log('✅ Environment template generated: env.template');
    
    // Generate summary report
    const summary = `# Migration Summary

## Data Extracted:
- ${Object.values(mockUsers).filter(u => u.role === 'landlord').length} landlords
- ${Object.values(mockTenants).length} tenants
- ${Object.values(mockTenants).reduce((total, tenant) => total + (tenant.reviews_received?.length || 0), 0)} reviews
- ${Object.values(mockTenants).reduce((total, tenant) => {
    return total + (tenant.reviews_received?.reduce((reviewTotal, review) => {
      return reviewTotal + (review.ratings ? Object.keys(review.ratings).length : 0);
    }, 0) || 0);
  }, 0)} detailed ratings
- ${Object.values(mockTenants).reduce((total, tenant) => {
    return total + (tenant.reviews_received?.reduce((reviewTotal, review) => {
      return reviewTotal + (review.proof_files?.length || 0);
    }, 0) || 0);
  }, 0)} proof files

## Next Steps:
1. Set up PostgreSQL database (Supabase, Railway, or Neon)
2. Run database_schema.sql to create tables
3. Run migration_data.sql to insert mock data
4. Set up cloud file storage (Supabase Storage, AWS S3, or Cloudinary)
5. Implement Django REST API backend
6. Update frontend to use real API endpoints

## Files Generated:
- database_schema.sql - Complete database schema
- migration_data.sql - Data migration script
- env.template - Environment configuration template
`;

    fs.writeFileSync('./MIGRATION_SUMMARY.md', summary);
    console.log('✅ Migration summary generated: MIGRATION_SUMMARY.md');
    
    console.log('\n🎉 Migration preparation complete!');
    console.log('📁 Generated files:');
    console.log('   - database_schema.sql');
    console.log('   - migration_data.sql');
    console.log('   - env.template');
    console.log('   - MIGRATION_SUMMARY.md');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  generateMigrationSQL,
  generateEnvTemplate,
  mockUsers,
  mockTenants
};
