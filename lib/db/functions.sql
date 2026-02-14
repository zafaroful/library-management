-- SQL Functions and Triggers for Library Management System
-- Run this after Drizzle migrations to add functions and triggers

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

