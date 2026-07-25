import { z } from 'zod';
export const createGameSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  status: z.string().optional(),
  maxPlayers: z.number().int().min(2).max(10)
});

export const updateGameSchema = createGameSchema.partial();