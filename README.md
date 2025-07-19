# Rently Frontend MVP

A React-based tenant and landlord review platform that helps build trust in the rental community.

## 🚀 Features

- **User Authentication**: Phone number-based login with role selection (Tenant/Landlord)
- **Profile Management**: Upload profile pictures and view personal profiles
- **User Search**: Find and browse other users by name
- **Review System**: Leave detailed ratings and comments for landlords/tenants
- **Rating Categories**: Role-specific rating criteria for comprehensive reviews
- **File Upload**: Support for lease agreement uploads
- **Responsive Design**: Clean, modern UI with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18 with functional components and hooks
- **Routing**: React Router v6+
- **Styling**: Tailwind CSS with custom components
- **HTTP Client**: Axios for API calls
- **State Management**: React Context API for authentication
- **File Handling**: Native file upload with validation

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Navbar.jsx       # Navigation bar
│   ├── UserCard.jsx     # User display card
│   └── ReviewStars.jsx  # Star rating components
├── pages/               # Page components
│   ├── Login.jsx        # Simple login page
│   ├── Signup.jsx       # Account creation page
│   ├── Dashboard.jsx    # User search and discovery
│   ├── Profile.jsx      # User profile view
│   ├── LeaveReview.jsx  # Review submission form
│   ├── ReviewConfirmation.jsx # Review success page
│   └── NotFound.jsx     # 404 error page
├── hooks/               # Custom React hooks
│   └── useAuth.js       # Authentication hook
├── utils/               # Utility functions
│   └── api.js           # API calls and endpoints
├── App.jsx              # Main app component
└── index.js             # App entry point
```

## 🏗️ Rating System

### Tenant Reviewing Landlord:
- Responsiveness to repair requests
- Respect tenant rights
- Friendliness
- Property condition
- Property as advertised
- Conflict resolution

### Landlord Reviewing Tenant:
- On-time rent payments
- Lease completion
- Communication/respect
- Before vs after condition of place
- No legal disputes filed

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner

## 🔗 Backend Integration

The frontend is designed to connect to a Django REST API backend. All API calls are located in `src/utils/api.js` with placeholder implementations.

### API Endpoints Expected:
- `POST /api/login` - User authentication
- `GET /api/search?name=` - Search users
- `GET /api/profile/:id` - Get user profile
- `POST /api/review` - Submit review
- `GET /api/profile` - Get current user profile

## 🎨 UI Components

### Custom Tailwind Classes:
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.input-field` - Form input styling
- `.card` - Card container styling

## 📱 Mobile Responsive

The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 📱 Page Structure

1. **Login Page** (`/login`)
   - Simple login with phone number and password
   - Input validation and error handling
   - Loading states during authentication
   - Link to signup page for new users

2. **Signup Page** (`/signup`)
   - Account creation with full name, phone number
   - Password and confirm password fields
   - Role selection (Tenant/Landlord)
   - Optional profile picture upload
   - Comprehensive form validation

3. **Dashboard** (`/dashboard`)
   - User search functionality
   - Browse users by role
   - Quick search by phone number
   - Responsive card-based layout

4. **Profile Pages** (`/profile/:id`)
   - Display user information and reviews
   - Average rating display
   - Review history
   - "Leave Review" action button

5. **Leave Review** (`/leave-review/:id`)
   - Comprehensive review form
   - Multiple rating categories
   - File upload for evidence
   - Form validation and progress indication

6. **Review Confirmation** (`/review-confirmation`)
   - Success confirmation
   - Review summary display
   - Navigation back to dashboard

7. **404 Not Found** (`*`)
   - User-friendly error page
   - Navigation options to get back on track

## 🔐 Authentication Flow

### Login Flow
1. Existing users enter phone number and password
2. Credentials validated against mock API
3. Successful login stores user data in localStorage
4. Redirect to dashboard

### Signup Flow
1. New users provide full name, phone number, and password
2. Role selection (Tenant/Landlord)
3. Optional profile picture upload
4. Account creation via mock API
5. Automatic login after successful signup
6. Redirect to dashboard

### Security Features
- Protected routes require authentication
- Public routes redirect authenticated users to dashboard
- Logout clears user data and redirects to login
- Form validation and error handling on all auth pages

### File Upload
- Support for images (profile pictures)
- Support for PDFs and images (lease agreements)
- File size validation (5MB for profile pics, 10MB for documents)
- Upload progress indicators

### Form Validation
- Phone number format validation
- Required field checking
- File type and size validation
- Real-time error feedback

### Review System
- Dynamic rating categories based on user roles
- 5-star rating system with interactive stars
- Optional comment field (500 character limit)
- Review confirmation and summary

## 🚧 Development Notes

- All API calls currently use mock data for development
- localStorage is used for user session persistence
- Error boundaries and loading states implemented
- Form validation includes client-side checks
- Responsive design follows mobile-first approach

## 🔄 Future Enhancements

- Real backend API integration
- User notifications system
- Advanced search filters
- Review moderation features
- Email/SMS verification
- Social sharing capabilities

## 📞 Support

For questions or issues, please contact the development team or create an issue in the project repository.

---

Built with ❤️ for the Rently community
