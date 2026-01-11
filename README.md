# Enfora

![Enfora Logo](frontend/src/assets/logos/Enfora%20Logo%20Overview.png)

Enfora is a web-based accountability platform that helps you achieve your goals through financial commitment. Create tasks with deadlines, stake money on your success, and let AI validate your completion evidence. Build discipline, compete on the global leaderboard, and turn your commitments into achievements.

## Features

### Task Management
- **Create Tasks with Stakes** - Set deadlines and optionally stake money to increase accountability
- **Recurring Tasks** - Set up daily, weekly, or custom recurring tasks to build lasting habits
- **AI-Powered Evidence Validation** - Submit screenshots, documents, or images as proof of completion
- **Smart Deadline Tracking** - Automatic task expiration and status updates when deadlines pass
- **Dispute Resolution** - Challenge rejected evidence submissions for manual review

### Accountability & Gamification
- **Global Leaderboard** - Compete with users worldwide based on reliability scores
- **Reliability Score (ERS)** - Comprehensive metric tracking completion rate, discipline, volume, and streaks
- **Public Profiles** - Showcase your achievements and reliability to others
- **Streak Tracking** - Build and maintain consecutive task completion streaks
- **Real-time Analytics** - Track your completion rates, average completion times, and financial metrics

### Payment & Security
- **Secure Payment Processing** - Stripe integration for payment method management
- **Automatic Charging** - Failed tasks automatically charge your saved payment method
- **Payment History** - View all transactions and charges with detailed records
- **Two-Factor Authentication (2FA)** - Protect your account with authenticator apps, email codes, or backup codes
- **Stake Limits** - Enhanced limits for users with 2FA enabled (unlimited stakes vs $20 total for non-2FA users)

### Account Management
- **Email Verification** - Secure account creation with email confirmation codes
- **Profile Customization** - Set display names, bios, and profile pictures
- **Notification Preferences** - Control email notifications for deadlines, disputes, and payment updates
- **Secure Sessions** - JWT-based authentication with refresh token rotation and reuse detection

## Tech Stack

### Frontend

**React 19.2.0** - Modern UI framework for building the interactive web application
- Used for all client-side rendering and component management
- Provides the foundation for the SPA (Single Page Application) architecture
- Handles user interactions, form submissions, and real-time UI updates

**React Router DOM 7.11.0** - Client-side routing and navigation
- Manages all application routes (dashboard, login, signup, leaderboard, etc.)
- Handles protected routes requiring authentication
- Provides smooth navigation without page reloads

**Vite 7.2.4** - Fast build tool and development server
- Development server with hot module replacement (HMR) for instant updates
- Optimized production builds with code splitting and tree shaking
- ES module-based architecture for faster build times

**Tailwind CSS 3.4.17** - Utility-first CSS framework
- Used for all styling across the application
- Provides responsive design utilities for mobile and desktop layouts
- Custom configuration for Enfora's design system (colors, spacing, typography)

**Stripe React & Stripe.js** - Payment UI components
- Secure card input components with built-in validation
- PCI-compliant payment method collection
- Client-side tokenization for secure payment processing

**Context API** - State management
- AuthContext manages authentication state globally (logged-in user, tokens, login/logout)
- Provides user data and auth methods to all components without prop drilling

### Backend

**Node.js with Express 5.1.0** - Web server and API framework
- RESTful API with organized route handlers for all endpoints
- Middleware pipeline for authentication, rate limiting, and CORS
- Handles all business logic, data validation, and request processing

**AWS DynamoDB** - NoSQL database (primary data store)
- Stores users, tasks, transactions, analytics, and leaderboard data
- On-demand pricing model for cost efficiency
- Global Secondary Indexes (GSI) for email lookups and efficient queries
- Composite keys (`userId + taskId`) for user data isolation and fast retrieval

**Redis** - In-memory caching and rate limiting
- Rate limiter storage for tracking request counts per IP/user
- Leaderboard cache for fast global rankings retrieval
- Session data caching to reduce database queries

**Stripe API** - Payment processing
- Customer and payment method management
- SetupIntent flow for collecting payment methods without immediate charges
- PaymentIntent for processing charges on failed tasks
- Webhook handling for payment status updates (succeeded, failed, canceled)

**OpenAI API** - AI-powered evidence validation
- GPT models analyze submitted evidence (images, documents) against task requirements
- Extracts text from PDFs and DOCX files for validation
- Returns validation scores (PASS/FAIL/REVIEW) with reasoning
- Validates metadata (file creation/modification dates) to prevent cheating

**AWS S3** - File storage
- Stores uploaded evidence files (images, PDFs, documents)
- Public URL generation for evidence retrieval
- 10MB file size limit enforcement
- Organized bucket structure by user and task IDs

**AWS EventBridge Scheduler** - Task scheduling and automation
- Creates individual schedules for each task deadline
- Triggers Lambda function when deadlines are reached
- Automatic cleanup of expired schedules
- Supports one-time and recurring task schedules

**AWS Lambda** - Serverless functions
- **expireTask** - Triggered by EventBridge when task deadlines pass; marks tasks as failed and initiates payment charges
- **refreshLeaderboard** - Runs every 10 minutes to compute global rankings and cache top 100 users in DynamoDB

**AWS SES** - Email service
- Sends verification codes during registration (15-minute expiration)
- 2FA authentication codes for email-based verification
- Dispute notifications to administrators
- Task deadline reminders (optional)

**JWT (jsonwebtoken)** - Authentication tokens
- Access tokens (15-minute expiration) for API authorization
- Refresh tokens (7-day expiration) for obtaining new access tokens
- Token versioning to invalidate all sessions on security events
- Secure HTTP-only cookies for refresh token storage

**bcrypt** - Password hashing
- Salted password hashing with cost factor 10
- Backup code hashing for 2FA
- Secure password comparison to prevent timing attacks

**Speakeasy** - Two-factor authentication (TOTP)
- Generates TOTP secrets and QR codes for authenticator apps
- 30-second time windows with ±2 iteration tolerance
- Backup code generation (10 single-use codes per user)

**Multer** - File upload middleware
- Handles multipart/form-data requests for evidence uploads
- Memory storage for direct S3 uploads (no local disk usage)
- File type validation (PNG, JPEG, PDF, DOCX, TXT, MD)
- File size limits (10MB max)

**express-rate-limit with rate-limit-redis** - API rate limiting
- Different limits per endpoint type:
  - Login: 100 attempts per 15 minutes (IP-based)
  - Registration: 5 per 5 minutes
  - Evidence upload: 10 per hour (user-based)
  - Payments: 10 per hour (user-based)
- Redis-backed for distributed rate limiting across multiple servers

### Additional Libraries

**pdf-parse & pdf-lib** - PDF processing
- Extracts text content from PDF evidence submissions
- Reads PDF metadata (creation/modification dates)

**mammoth** - DOCX processing
- Converts DOCX files to text for AI validation
- Preserves document structure for better analysis

**exifr** - Image metadata extraction
- Reads EXIF data from photos (creation date, camera info)
- Validates evidence authenticity via metadata

**qrcode** - QR code generation
- Creates QR codes for 2FA authenticator app setup
- Encodes TOTP secrets in standard otpauth:// format

**adm-zip** - DOCX file processing
- Extracts internal XML metadata from DOCX files (which are ZIP-structured documents)

**xml2js** - XML parsing
- Parses XML responses from AWS services
- Handles structured data from external APIs

**uuid** - Unique identifier generation
- Generates user IDs, task IDs, and transaction IDs
- Ensures globally unique identifiers across distributed systems

## Architecture Highlights

### Security
- **CSRF Protection** - Token-based CSRF middleware (configurable)
- **Refresh Token Reuse Detection** - Increments token version to invalidate all sessions if reuse detected
- **Rate Limiting** - Redis-backed rate limiting on all sensitive endpoints
- **Password Requirements** - Enforced minimum length and complexity
- **Secure Headers** - CORS configured with dynamic origin checking

### Data Flow
1. **Task Creation** → Stored in DynamoDB → EventBridge schedule created for deadline
2. **Evidence Upload** → S3 storage → AI validation → Task status updated → Analytics recalculated
3. **Task Expiration** → EventBridge triggers Lambda → Task marked failed → Payment charged → Analytics updated
4. **Leaderboard** → Lambda scans all users every 10 min → Ranks cached in DynamoDB → Fast retrieval

### Payment Flow
1. User adds payment method via Stripe SetupIntent
2. Payment method attached to Stripe customer
3. Task fails → Internal charge API called → PaymentIntent created
4. Stripe processes charge off-session
5. Webhook updates transaction status in DynamoDB

### AI Validation Pipeline
1. Evidence uploaded to S3 with metadata validation
2. Text extracted from documents (PDF/DOCX) or image analyzed
3. OpenAI evaluates evidence against task description and requirements
4. Validation result (PASS/FAIL/REVIEW) returned with confidence score
5. Task status automatically updated based on AI decision
6. Users can dispute rejected validations for manual review


### Visit the live beta at [enfora.app](https://www.enfora.app)
### Developed by Adrian Simon