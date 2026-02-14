import { pgTable, uuid, varchar, integer, decimal, date, timestamp, text, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['Admin', 'Librarian', 'Student', 'Member']);
export const availabilityStatusEnum = pgEnum('availability_status', ['Available', 'Borrowed', 'Reserved']);
export const loanStatusEnum = pgEnum('loan_status', ['Borrowed', 'Returned']);
export const paymentStatusEnum = pgEnum('payment_status', ['Paid', 'Unpaid']);
export const reservationStatusEnum = pgEnum('reservation_status', ['Pending', 'Collected', 'Cancelled']);
export const recitationTypeEnum = pgEnum('recitation_type', ['TTS', 'Recorded']);

// Users table
export const users = pgTable('users', {
  userId: uuid('user_id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
}));

// Books table
export const books = pgTable('books', {
  bookId: uuid('book_id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  isbn: varchar('isbn', { length: 20 }).unique(),
  category: varchar('category', { length: 100 }),
  availabilityStatus: availabilityStatusEnum('availability_status').default('Available').notNull(),
  copiesTotal: integer('copies_total').notNull().default(1),
  copiesAvailable: integer('copies_available').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  isbnIdx: index('idx_books_isbn').on(table.isbn),
  categoryIdx: index('idx_books_category').on(table.category),
  availabilityIdx: index('idx_books_availability').on(table.availabilityStatus),
}));

// Loans table
export const loans = pgTable('loans', {
  loanId: uuid('loan_id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull().references(() => books.bookId, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  borrowDate: date('borrow_date').notNull().default(sql`CURRENT_DATE`),
  dueDate: date('due_date').notNull(),
  returnDate: date('return_date'),
  status: loanStatusEnum('status').notNull().default('Borrowed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_loans_user_id').on(table.userId),
  bookIdIdx: index('idx_loans_book_id').on(table.bookId),
  statusIdx: index('idx_loans_status').on(table.status),
  dueDateIdx: index('idx_loans_due_date').on(table.dueDate),
}));

// Fines table
export const fines = pgTable('fines', {
  fineId: uuid('fine_id').primaryKey().defaultRandom(),
  loanId: uuid('loan_id').notNull().references(() => loans.loanId, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull().default('0'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('Unpaid'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  loanIdIdx: index('idx_fines_loan_id').on(table.loanId),
}));

// Reservations table
export const reservations = pgTable('reservations', {
  reservationId: uuid('reservation_id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull().references(() => books.bookId, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  reservationDate: date('reservation_date').notNull().default(sql`CURRENT_DATE`),
  status: reservationStatusEnum('status').notNull().default('Pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  bookIdIdx: index('idx_reservations_book_id').on(table.bookId),
  userIdIdx: index('idx_reservations_user_id').on(table.userId),
  statusIdx: index('idx_reservations_status').on(table.status),
}));

// Reports table
export const reports = pgTable('reports', {
  reportId: uuid('report_id').primaryKey().defaultRandom(),
  generatedBy: uuid('generated_by').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  reportType: varchar('report_type', { length: 100 }).notNull(),
  dateGenerated: timestamp('date_generated', { withTimezone: true }).defaultNow().notNull(),
  reportData: jsonb('report_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  generatedByIdx: index('idx_reports_generated_by').on(table.generatedBy),
}));

// Image Search Log table
export const imageSearchLog = pgTable('image_search_log', {
  searchId: uuid('search_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'set null' }),
  imageFilePath: text('image_file_path'),
  matchedBookId: uuid('matched_book_id').references(() => books.bookId, { onDelete: 'set null' }),
  searchDate: timestamp('search_date', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_image_search_user_id').on(table.userId),
}));

// Chatbot Interaction table
export const chatbotInteraction = pgTable('chatbot_interaction', {
  chatId: uuid('chat_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'set null' }),
  question: text('question').notNull(),
  response: text('response').notNull(),
  interactionDate: timestamp('interaction_date', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_chatbot_user_id').on(table.userId),
}));

// Book Recitation table
export const bookRecitation = pgTable('book_recitation', {
  recitationId: uuid('recitation_id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull().references(() => books.bookId, { onDelete: 'cascade' }),
  audioFilePath: text('audio_file_path').notNull(),
  recitationType: recitationTypeEnum('recitation_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

