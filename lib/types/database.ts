export type UserRole = 'Admin' | 'Librarian' | 'Student' | 'Member';
export type LoanStatus = 'Borrowed' | 'Returned';
export type ReservationStatus = 'Pending' | 'Collected' | 'Cancelled';
export type AvailabilityStatus = 'Available' | 'Borrowed' | 'Reserved';
export type PaymentStatus = 'Paid' | 'Unpaid';
export type RecitationType = 'TTS' | 'Recorded';

export interface User {
  user_id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Book {
  book_id: string;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  cover_image_url?: string | null;
  description?: string | null;
  pages?: number | null;
  publication_year?: number | null;
  availability_status: AvailabilityStatus;
  copies_total: number;
  copies_available: number;
  created_at?: string;
  updated_at?: string;
}

export interface Loan {
  loan_id: string;
  book_id: string;
  user_id: string;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: LoanStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Fine {
  fine_id: string;
  loan_id: string;
  amount: number;
  payment_status: PaymentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Reservation {
  reservation_id: string;
  book_id: string;
  user_id: string;
  reservation_date: string;
  status: ReservationStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Report {
  report_id: string;
  generated_by: string;
  report_type: string;
  date_generated: string;
  report_data?: any;
  created_at?: string;
}

export interface ImageSearchLog {
  search_id: string;
  user_id?: string;
  image_file_path?: string;
  matched_book_id?: string;
  search_date: string;
  created_at?: string;
}

export interface ChatbotInteraction {
  chat_id: string;
  user_id?: string;
  question: string;
  response: string;
  interaction_date: string;
  created_at?: string;
}

export interface BookRecitation {
  recitation_id: string;
  book_id: string;
  audio_file_path: string;
  recitation_type: RecitationType;
  created_at?: string;
  updated_at?: string;
}

export interface LoanWithDetails extends Loan {
  book?: Book;
  user?: User;
  fine?: Fine;
}

export interface ReservationWithDetails extends Reservation {
  book?: Book;
  user?: User;
}

