import { format, addDays, differenceInDays, parseISO } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd');
};

export const formatDateTime = (date: string | Date): string => {
  return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd HH:mm:ss');
};

export const calculateDueDate = (borrowDate: Date, days: number = 14): Date => {
  return addDays(borrowDate, days);
};

export const calculateDaysOverdue = (dueDate: string | Date): number => {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const today = new Date();
  const diff = differenceInDays(today, due);
  return diff > 0 ? diff : 0;
};

export const calculateFine = (daysOverdue: number, ratePerDay: number = 1.0): number => {
  return daysOverdue * ratePerDay;
};

