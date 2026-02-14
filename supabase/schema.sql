-- Library Management System Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (using NextAuth, not Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Librarian', 'Student', 'Member')),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table
CREATE TABLE IF NOT EXISTS public.books (
    book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    category VARCHAR(100),
    availability_status VARCHAR(20) DEFAULT 'Available' CHECK (availability_status IN ('Available', 'Borrowed', 'Reserved')),
    copies_total INTEGER NOT NULL DEFAULT 1 CHECK (copies_total >= 0),
    copies_available INTEGER NOT NULL DEFAULT 1 CHECK (copies_available >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loans table
CREATE TABLE IF NOT EXISTS public.loans (
    loan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.books(book_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Borrowed' CHECK (status IN ('Borrowed', 'Returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fines table
CREATE TABLE IF NOT EXISTS public.fines (
    fine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES public.loans(loan_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    reservation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.books(book_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Collected', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_by UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL,
    date_generated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image Search Log table
CREATE TABLE IF NOT EXISTS public.image_search_log (
    search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    image_file_path TEXT,
    matched_book_id UUID REFERENCES public.books(book_id) ON DELETE SET NULL,
    search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot Interaction table
CREATE TABLE IF NOT EXISTS public.chatbot_interaction (
    chat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Book Recitation table
CREATE TABLE IF NOT EXISTS public.book_recitation (
    recitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.books(book_id) ON DELETE CASCADE,
    audio_file_path TEXT NOT NULL,
    recitation_type VARCHAR(20) NOT NULL CHECK (recitation_type IN ('TTS', 'Recorded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_availability ON public.books(availability_status);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book_id ON public.loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON public.loans(due_date);
CREATE INDEX IF NOT EXISTS idx_fines_loan_id ON public.fines(loan_id);
CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON public.reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON public.reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_image_search_user_id ON public.image_search_log(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_user_id ON public.chatbot_interaction(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at (drop existing triggers first to allow re-running)
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON public.books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON public.loans;
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fines_updated_at ON public.fines;
CREATE TRIGGER update_fines_updated_at BEFORE UPDATE ON public.fines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_recitation_updated_at ON public.book_recitation;
CREATE TRIGGER update_book_recitation_updated_at BEFORE UPDATE ON public.book_recitation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate fines for overdue loans
CREATE OR REPLACE FUNCTION calculate_overdue_fine()
RETURNS TRIGGER AS $$
DECLARE
    days_overdue INTEGER;
    daily_fine_rate DECIMAL(10, 2) := 1.00; -- $1 per day
    fine_amount DECIMAL(10, 2);
BEGIN
    -- Check if loan is overdue and not returned
    IF NEW.status = 'Borrowed' AND NEW.due_date < CURRENT_DATE AND NEW.return_date IS NULL THEN
        days_overdue := CURRENT_DATE - NEW.due_date;
        fine_amount := days_overdue * daily_fine_rate;
        
        -- Check if fine already exists
        IF NOT EXISTS (SELECT 1 FROM public.fines WHERE loan_id = NEW.loan_id AND payment_status = 'Unpaid') THEN
            INSERT INTO public.fines (loan_id, amount, payment_status)
            VALUES (NEW.loan_id, fine_amount, 'Unpaid');
        ELSE
            -- Update existing fine
            UPDATE public.fines
            SET amount = fine_amount
            WHERE loan_id = NEW.loan_id AND payment_status = 'Unpaid';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to calculate fines on loan updates
DROP TRIGGER IF EXISTS trigger_calculate_fine ON public.loans;
CREATE TRIGGER trigger_calculate_fine
    AFTER INSERT OR UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION calculate_overdue_fine();

-- Function to update book availability when loan is created/returned
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'Borrowed' THEN
        -- Decrease available copies
        UPDATE public.books
        SET copies_available = copies_available - 1,
            availability_status = CASE 
                WHEN copies_available - 1 <= 0 THEN 'Borrowed'
                ELSE 'Available'
            END
        WHERE book_id = NEW.book_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'Borrowed' AND NEW.status = 'Returned' THEN
        -- Increase available copies
        UPDATE public.books
        SET copies_available = copies_available + 1,
            availability_status = CASE 
                WHEN copies_available + 1 > 0 THEN 'Available'
                ELSE 'Borrowed'
            END
        WHERE book_id = NEW.book_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update book availability
DROP TRIGGER IF EXISTS trigger_update_book_availability ON public.loans;
CREATE TRIGGER trigger_update_book_availability
    AFTER INSERT OR UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION update_book_availability();

-- Row Level Security is disabled since we're using NextAuth
-- Security is handled at the application level through NextAuth middleware and API route checks
-- All database operations use the service role key which bypasses RLS
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.image_search_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chatbot_interaction ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.book_recitation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Since we're using NextAuth instead of Supabase Auth, RLS policies
-- that depend on auth.uid() and auth.role() won't work. 
-- Security is handled at the application level through NextAuth middleware and API route checks.
-- 
-- For now, we'll disable RLS or use service role key for all operations.
-- In production, you may want to implement a custom RLS solution or handle
-- all security checks in your API routes.

-- Allow service role to manage all data (used by API routes with admin client)
-- This is safe because API routes already have authentication checks via NextAuth

