import { z } from 'zod';
import { PERSONAL_ACCOUNT_TYPES, PERSONAL_TRANSACTION_TYPES } from '@/lib/constants';

export const accountSchema = z.object({
  name: z.string().min(2, 'Enter an account name'),
  accountType: z.enum(PERSONAL_ACCOUNT_TYPES),
  institution: z.string().max(100).optional(),
  openingBalance: z.coerce.number().default(0),
});

export type AccountInput = z.infer<typeof accountSchema>;

export const transactionSchema = z.object({
  accountId: z.string().uuid('Choose an account'),
  categoryId: z.string().uuid().optional(),
  type: z.enum(PERSONAL_TRANSACTION_TYPES),
  amount: z.coerce.number().positive('Enter an amount greater than zero'),
  description: z.string().max(200).optional(),
  occurredAt: z.string().min(1, 'Choose a date'),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const salaryTransferSchema = z.object({
  accountId: z.string().uuid('Choose a destination account'),
  amount: z.coerce.number().positive('Enter an amount greater than zero'),
  note: z.string().max(200).optional(),
  transferredAt: z.string().min(1, 'Choose a date'),
});

export type SalaryTransferInput = z.infer<typeof salaryTransferSchema>;

export const categoryBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  monthlyBudget: z.coerce.number().min(0, 'Budget cannot be negative'),
});

export type CategoryBudgetInput = z.infer<typeof categoryBudgetSchema>;
