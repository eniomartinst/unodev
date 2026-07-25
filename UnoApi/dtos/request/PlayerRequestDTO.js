import { z } from 'zod';

export const createPlayerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email'),
  age: z.number().int().min(0, 'Age must be a positive number').max(120, 'Age must be 120 or less')
});

export const updatePlayerSchema = createPlayerSchema.partial();