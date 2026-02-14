# Library Management System

A comprehensive Library Management System built with Next.js, Supabase, and NextAuth.js.

## Features

### Core Features
- **Book Management**: Add, update, delete, and search books
- **User Management**: Manage users with different roles (Admin, Librarian, Student, Member)
- **Borrowing & Returning**: Issue and return books with automatic due date calculation
- **Fine Calculation**: Automatic fine calculation for overdue books
- **Reservation System**: Reserve books that are currently borrowed
- **Reports & Analytics**: Generate reports on borrowing trends, popular books, overdue books, fines, and active users

### Advanced Features
- **Image Search**: Search for books by uploading book cover or barcode images
- **Chatbot**: AI-powered chatbot using OpenAI for 24/7 library assistance
- **Book Recitation**: Text-to-speech and recorded audio for books

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js v5
- **Image Recognition**: Google Vision API or AWS Rekognition (configurable)
- **Chatbot**: OpenAI API
- **TTS**: Google TTS or AWS Polly (configurable)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Get your Supabase URL and keys from the project settings

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# OpenAI Configuration (for Chatbot)
OPENAI_API_KEY=your_openai_api_key

# Image Recognition API (choose one)
# Option 1: Google Vision API
GOOGLE_VISION_API_KEY=your_google_vision_api_key

# Option 2: AWS Rekognition
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Text-to-Speech API (choose one)
# Option 1: Google TTS
GOOGLE_TTS_API_KEY=your_google_tts_api_key

# Option 2: AWS Polly (uses same AWS credentials as above)
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The system includes the following main entities:

- **Books**: Book information, availability, and copies
- **Users**: User profiles with role-based access
- **Loans**: Borrowing and returning transactions
- **Fines**: Fine calculation and payment tracking
- **Reservations**: Book reservation system
- **Reports**: Generated reports and analytics
- **Image_Search_Log**: Image search history
- **Chatbot_Interaction**: Chatbot conversation logs
- **Book_Recitation**: Audio files for books

## User Roles

- **Admin**: Full system access, user management
- **Librarian**: Book management, loan processing, reports
- **Student/Member**: Browse books, borrow, reserve, view own loans

## API Routes

- `/api/books` - Book CRUD operations
- `/api/loans` - Loan management
- `/api/reservations` - Reservation management
- `/api/fines` - Fine management
- `/api/reports` - Report generation
- `/api/image-search` - Image-based book search
- `/api/chatbot` - Chatbot interactions
- `/api/recitation` - Book recitation management

## Security

- Row Level Security (RLS) policies in Supabase
- Role-based access control (RBAC)
- Protected API routes with NextAuth.js
- Input validation with Zod
- SQL injection prevention via Supabase client

## Deployment

1. Deploy to Vercel or your preferred hosting platform
2. Set environment variables in your hosting platform
3. Ensure Supabase database is accessible from your deployment
4. Configure CORS settings if needed

## License

This project is open source and available under the MIT License.
