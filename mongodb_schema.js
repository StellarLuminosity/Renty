/**
 * MongoDB Schema Design for Renty
 * Document-based schema adapted from the relational design
 */

// MongoDB Connection Configuration
const MONGODB_URI = "mongodb+srv://miodragmtasic:D8eX6doz7Nxep9lA@cluster0.hzod4on.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = "renty";

// Collection schemas and validation rules
const collections = {
  
  // Landlords Collection
  landlords: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "email", "phone_number", "password_hash", "role"],
        properties: {
          _id: { bsonType: "objectId" },
          name: { bsonType: "string", minLength: 1, maxLength: 255 },
          email: { 
            bsonType: "string",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
          },
          phone_number: { bsonType: "string", minLength: 10, maxLength: 20 },
          password_hash: { bsonType: "string", minLength: 60 },
          role: { enum: ["landlord"] },
          profile_picture: { bsonType: ["string", "null"] },
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" },
          // Optional fields for credit score and bankruptcy status (for future use)
creditScore: { bsonType: ["number", "null"] },
bankruptcyReport: { bsonType: ["bool", "null"] }
        }
      }
    },
    indexes: [
      { email: 1, unique: true },
      { phone_number: 1 },
      { created_at: -1 }
    ]
  },

  // Tenants Collection
  tenants: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "role"],
        properties: {
          _id: { bsonType: "objectId" },
          name: { bsonType: "string", minLength: 1, maxLength: 255 },
          email: { 
            bsonType: ["string", "null"],
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
          },
          phone_number: { bsonType: ["string", "null"] },
          role: { enum: ["tenant"] },
          profile_picture: { bsonType: ["string", "null"] },
          average_rating: { 
            bsonType: "number", 
            minimum: 0, 
            maximum: 5 
          },
          total_reviews: { bsonType: "int", minimum: 0 },
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" }
        }
      }
    },
    indexes: [
      { name: 1 },
      { email: 1 },
      { average_rating: -1 },
      { created_at: -1 }
    ]
  },

  // Reviews Collection (with embedded ratings and proof files)
  reviews: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["tenant_id", "reviewer_id", "rating", "reviewer_name", "reviewer_role", "date_created"],
        properties: {
          _id: { bsonType: "objectId" },
          tenant_id: { bsonType: "objectId" },
          reviewer_id: { bsonType: "objectId" },
          rating: { bsonType: "int", minimum: 1, maximum: 5 },
          comment: { bsonType: ["string", "null"] },
          property_address: { bsonType: ["string", "null"] },
          rental_period: { bsonType: ["string", "null"] },
          reviewer_name: { bsonType: "string" },
          reviewer_role: { enum: ["landlord"] },
          date_created: { bsonType: "date" },
          
          // Embedded detailed ratings
          ratings: {
            bsonType: "object",
            properties: {
              rent_payments: { bsonType: "int", minimum: 1, maximum: 5 },
              lease_completion: { bsonType: "int", minimum: 1, maximum: 5 },
              communication: { bsonType: "int", minimum: 1, maximum: 5 },
              property_care: { bsonType: "int", minimum: 1, maximum: 5 },
              legal_disputes: { bsonType: "int", minimum: 1, maximum: 5 }
            }
          },
          
          // Embedded proof files
          proof_files: {
            bsonType: "array",
            items: {
              bsonType: "object",
              required: ["name", "type", "size", "url", "uploaded_date"],
              properties: {
                name: { bsonType: "string" },
                type: { bsonType: "string" },
                size: { bsonType: "long" },
                url: { bsonType: "string" },
                uploaded_date: { bsonType: "date" }
              }
            }
          },
          
          // Embedded lease agreement
          lease_agreement: {
            bsonType: ["object", "null"],
            properties: {
              name: { bsonType: "string" },
              type: { bsonType: "string" },
              size: { bsonType: "long" },
              url: { bsonType: "string" },
              uploaded_date: { bsonType: "date" }
            }
          },
          
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" }
        }
      }
    },
    indexes: [
      { tenant_id: 1 },
      { reviewer_id: 1 },
      { date_created: -1 },
      { rating: -1 },
      { "tenant_id": 1, "date_created": -1 }
    ]
  }
};

// Sample data structure for MongoDB
const sampleData = {
  landlords: [
    {
      name: "John Doe",
      email: "john.doe@email.com",
      phone_number: "+1-555-0123",
      password_hash: "$2b$10$hashedpassword1",
      role: "landlord",
      profile_picture: null,
      created_at: new Date("2023-01-15"),
      updated_at: new Date("2023-01-15")
    },
    {
      name: "Jane Smith",
      email: "jane.smith@email.com", 
      phone_number: "+1-555-0124",
      password_hash: "$2b$10$hashedpassword2",
      role: "landlord",
      profile_picture: null,
      created_at: new Date("2023-02-20"),
      updated_at: new Date("2023-02-20")
    },
    {
      name: "Mike Johnson",
      email: "mike.johnson@email.com",
      phone_number: "+1-555-0125",
      password_hash: "$2b$10$hashedpassword3",
      role: "landlord", 
      profile_picture: null,
      created_at: new Date("2023-03-10"),
      updated_at: new Date("2023-03-10")
    }
  ],
  
  tenants: [
    {
      name: "Alice Wilson",
      email: "alice.wilson@email.com",
      phone_number: "+1-555-0101",
      role: "tenant",
      profile_picture: null,
      average_rating: 4.5,
      total_reviews: 2,
      created_at: new Date("2023-01-20"),
      updated_at: new Date("2023-12-15"),
      creditScoreLabel: "Good",
      bankruptcyReport: false
    },
    {
      name: "Bob Thompson",
      email: "bob.thompson@email.com",
      phone_number: "+1-555-0102", 
      role: "tenant",
      profile_picture: null,
      average_rating: 4.2,
      total_reviews: 3,
      created_at: new Date("2021-09-01"),
      updated_at: new Date("2023-02-28"),
      creditScoreLabel: "Mediocre",
      bankruptcyReport: true
    },
    {
      name: "Carol Davis",
      email: "carol.davis@email.com",
      phone_number: "+1-555-0103",
      role: "tenant",
      profile_picture: null,
      average_rating: 4.4,
      total_reviews: 1,
      created_at: new Date("2023-04-01"),
      updated_at: new Date("2024-03-15"),
      creditScoreLabel: "Bad",
      bankruptcyReport: true
    },
    {
      name: "David Brown",
      email: "david.brown@email.com",
      phone_number: "+1-555-0126",
      role: "tenant",
      profile_picture: null,
      average_rating: 0,
      total_reviews: 0,
      created_at: new Date("2024-01-10"),
      updated_at: new Date("2024-01-10"),
      creditScoreLabel: "Bad",
      bankruptcyReport: false
    }
  ]
};

// Note: Reviews will reference the tenant and landlord ObjectIds after insertion
const sampleReviews = [
  {
    // tenant_id and reviewer_id will be set after inserting landlords/tenants
    rating: 5,
    comment: "Excellent tenant! Always paid rent on time and kept the property in great condition.",
    property_address: "123 Main St, Apt 4B",
    rental_period: "Jan 2023 - Dec 2023",
    reviewer_name: "John Doe",
    reviewer_role: "landlord",
    date_created: new Date("2023-12-15"),
    ratings: {
      rent_payments: 5,
      lease_completion: 5,
      communication: 5,
      property_care: 5,
      legal_disputes: 5
    },
    proof_files: [
      {
        name: "property_before.jpg",
        type: "image/jpeg",
        size: 2048000,
        url: "mock_proof_1640995200_abc123def.jpg",
        uploaded_date: new Date("2023-12-15T10:30:00Z")
      },
      {
        name: "rent_receipts.pdf",
        type: "application/pdf",
        size: 1024000,
        url: "mock_proof_1640995201_def456ghi.pdf",
        uploaded_date: new Date("2023-12-15T10:31:00Z")
      }
    ],
    lease_agreement: null,
    created_at: new Date("2023-12-15"),
    updated_at: new Date("2023-12-15")
  },
  {
    rating: 4,
    comment: "Good tenant overall. Had minor communication issues but resolved them quickly.",
    property_address: "456 Oak Ave, Unit 2",
    rental_period: "Jun 2022 - May 2023",
    reviewer_name: "Jane Smith",
    reviewer_role: "landlord",
    date_created: new Date("2023-05-20"),
    ratings: {
      rent_payments: 5,
      lease_completion: 4,
      communication: 3,
      property_care: 4,
      legal_disputes: 4
    },
    proof_files: [
      {
        name: "lease_signed.pdf",
        type: "application/pdf",
        size: 1536000,
        url: "mock_proof_1684704000_ghi789jkl.pdf",
        uploaded_date: new Date("2023-05-20T14:20:00Z")
      }
    ],
    lease_agreement: null,
    created_at: new Date("2023-05-20"),
    updated_at: new Date("2023-05-20")
  },
  {
    rating: 4,
    comment: "Reliable tenant with good property care habits.",
    property_address: "789 Pine St, Apt 1A",
    rental_period: "Mar 2022 - Feb 2023",
    reviewer_name: "John Doe",
    reviewer_role: "landlord",
    date_created: new Date("2023-02-28"),
    ratings: {
      rent_payments: 4,
      lease_completion: 4,
      communication: 4,
      property_care: 5,
      legal_disputes: 3
    },
    proof_files: [
      {
        name: "property_condition.jpg",
        type: "image/jpeg",
        size: 1792000,
        url: "mock_proof_1677628800_jkl012mno.jpg",
        uploaded_date: new Date("2023-02-28T16:45:00Z")
      }
    ],
    lease_agreement: null,
    created_at: new Date("2023-02-28"),
    updated_at: new Date("2023-02-28")
  },
  {
    rating: 4,
    comment: "Professional and respectful tenant. Would rent to again.",
    property_address: "321 Elm St",
    rental_period: "Sep 2021 - Aug 2022",
    reviewer_name: "Mike Johnson",
    reviewer_role: "landlord",
    date_created: new Date("2022-08-30"),
    ratings: {
      rent_payments: 4,
      lease_completion: 4,
      communication: 5,
      property_care: 4,
      legal_disputes: 4
    },
    proof_files: [],
    lease_agreement: null,
    created_at: new Date("2022-08-30"),
    updated_at: new Date("2022-08-30")
  },
  {
    rating: 5,
    comment: "Outstanding tenant! No issues whatsoever during the entire lease period.",
    property_address: "654 Maple Dr, Unit 3", 
    rental_period: "Jan 2021 - Dec 2021",
    reviewer_name: "Jane Smith",
    reviewer_role: "landlord",
    date_created: new Date("2021-12-31"),
    ratings: {
      rent_payments: 5,
      lease_completion: 4,
      communication: 5,
      property_care: 4,
      legal_disputes: 4
    },
    proof_files: [],
    lease_agreement: null,
    created_at: new Date("2021-12-31"),
    updated_at: new Date("2021-12-31")
  },
  {
    rating: 4,
    comment: "Good tenant with timely rent payments and proper communication.",
    property_address: "987 Cedar Ln",
    rental_period: "Apr 2023 - Mar 2024",
    reviewer_name: "John Doe",
    reviewer_role: "landlord",
    date_created: new Date("2024-03-15"),
    ratings: {
      rent_payments: 5,
      lease_completion: 4,
      communication: 5,
      property_care: 4,
      legal_disputes: 4
    },
    proof_files: [
      {
        name: "final_inspection.jpg",
        type: "image/jpeg",
        size: 2304000,
        url: "mock_proof_1710460800_mno345pqr.jpg",
        uploaded_date: new Date("2024-03-15T12:00:00Z")
      },
      {
        name: "damage_report.pdf",
        type: "application/pdf",
        size: 896000,
        url: "mock_proof_1710460801_pqr678stu.pdf",
        uploaded_date: new Date("2024-03-15T12:01:00Z")
      }
    ],
    lease_agreement: null,
    created_at: new Date("2024-03-15"),
    updated_at: new Date("2024-03-15")
  }
];

export {
  MONGODB_URI,
  DATABASE_NAME,
  collections,
  sampleData,
  sampleReviews
};
