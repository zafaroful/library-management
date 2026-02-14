// Utility functions to transform Drizzle camelCase to snake_case for API responses

export function transformUser(user: any) {
  if (!user) return null;
  return {
    user_id: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    created_at: user.createdAt?.toISOString(),
    updated_at: user.updatedAt?.toISOString(),
  };
}

export function transformBook(book: any) {
  if (!book) return null;
  return {
    book_id: book.bookId,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    category: book.category,
    availability_status: book.availabilityStatus,
    copies_total: Number(book.copiesTotal),
    copies_available: Number(book.copiesAvailable),
    created_at: book.createdAt?.toISOString(),
    updated_at: book.updatedAt?.toISOString(),
  };
}

export function transformLoan(loan: any) {
  if (!loan) return null;
  return {
    loan_id: loan.loanId,
    book_id: loan.bookId,
    user_id: loan.userId,
    borrow_date: loan.borrowDate?.toString(),
    due_date: loan.dueDate?.toString(),
    return_date: loan.returnDate?.toString(),
    status: loan.status,
    created_at: loan.createdAt?.toISOString(),
    updated_at: loan.updatedAt?.toISOString(),
  };
}

export function transformFine(fine: any) {
  if (!fine) return null;
  return {
    fine_id: fine.fineId,
    loan_id: fine.loanId,
    amount: Number(fine.amount),
    payment_status: fine.paymentStatus,
    created_at: fine.createdAt?.toISOString(),
    updated_at: fine.updatedAt?.toISOString(),
  };
}

export function transformReservation(reservation: any) {
  if (!reservation) return null;
  return {
    reservation_id: reservation.reservationId,
    book_id: reservation.bookId,
    user_id: reservation.userId,
    reservation_date: reservation.reservationDate?.toString(),
    status: reservation.status,
    created_at: reservation.createdAt?.toISOString(),
    updated_at: reservation.updatedAt?.toISOString(),
  };
}

export function transformLoanWithDetails(row: any) {
  return {
    ...transformLoan(row.loan),
    book: transformBook(row.book),
    user: transformUser(row.user),
    fine: row.fine ? transformFine(row.fine) : null,
  };
}

export function transformReservationWithDetails(row: any) {
  return {
    ...transformReservation(row.reservation),
    book: transformBook(row.book),
    user: transformUser(row.user),
  };
}

export function transformFineWithDetails(row: any) {
  return {
    ...transformFine(row.fine),
    loan: row.loan
      ? {
          ...transformLoan(row.loan),
          book: transformBook(row.book),
          user: transformUser(row.user),
        }
      : null,
  };
}

